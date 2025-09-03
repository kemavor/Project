"""
Question Generation Service using NLP techniques
Implements Named Entity Recognition (NER) and Keyphrase Extraction
to auto-generate multiple-choice and short-answer questions
"""

from models import LectureTranscription, GeneratedQuestion, QuestionAnswer, CourseDocument
from database import SessionLocal
import os
import re
import random
import json
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import logging

# Initialize logger first
logger = logging.getLogger(__name__)

# NLP Libraries with robust error handling
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError as e:
    SPACY_AVAILABLE = False
    spacy = None
    logger.warning(f"SpaCy not available: {e}")

try:
    import nltk
    NLTK_AVAILABLE = True
except ImportError as e:
    NLTK_AVAILABLE = False
    nltk = None
    logger.warning(f"NLTK not available: {e}")

try:
    from keybert import KeyBERT
    KEYBERT_AVAILABLE = True
except ImportError as e:
    KEYBERT_AVAILABLE = False
    KeyBERT = None
    logger.warning(f"KeyBERT not available: {e}")

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError as e:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None
    logger.warning(f"SentenceTransformers not available: {e}")

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError as e:
    SKLEARN_AVAILABLE = False
    TfidfVectorizer = None
    cosine_similarity = None
    logger.warning(f"Scikit-learn not available: {e}")

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError as e:
    NUMPY_AVAILABLE = False
    np = None
    logger.warning(f"NumPy not available: {e}")

# Download required NLTK data with safe fallbacks
def _safe_download_nltk_data():
    """Safely download NLTK data without breaking startup"""
    if not NLTK_AVAILABLE:
        return
    
    nltk_resources = [
        ('tokenizers/punkt', 'punkt'),
        ('corpora/stopwords', 'stopwords'),
        ('taggers/averaged_perceptron_tagger', 'averaged_perceptron_tagger')
    ]
    
    for resource_path, resource_name in nltk_resources:
        try:
            nltk.data.find(resource_path)
        except (LookupError, OSError):
            try:
                nltk.download(resource_name, quiet=True)
                logger.info(f"Downloaded NLTK resource: {resource_name}")
            except Exception as e:
                logger.warning(f"Could not download NLTK {resource_name}: {e}")

# Initialize NLTK data in a safe way
try:
    _safe_download_nltk_data()
except Exception as e:
    logger.warning(f"NLTK data initialization failed: {e}")


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QuestionGenerationService:
    """Service for generating questions from lecture transcripts using NLP"""

    def __init__(self):
        self.nlp = None
        self.keybert_model = None
        self.sentence_model = None
        self.tfidf_vectorizer = None
        self._initialize_models()

    def _initialize_models(self):
        """Initialize NLP models with robust error handling"""
        logger.info("Initializing NLP models for question generation...")
        
        # Initialize spaCy model for NER
        self._initialize_spacy()
        
        # Initialize KeyBERT for keyphrase extraction
        self._initialize_keybert()
        
        # Initialize sentence transformer
        self._initialize_sentence_transformers()
        
        # Initialize TF-IDF vectorizer
        self._initialize_tfidf()
        
        # Log final status
        self._log_initialization_status()
    
    def _initialize_spacy(self):
        """Initialize spaCy model with fallbacks"""
        self.nlp = None
        if not SPACY_AVAILABLE:
            logger.warning("SpaCy not available. Entity-based questions will be limited.")
            return
        
        # Try different spaCy models in order of preference
        models_to_try = ["en_core_web_sm", "en_core_web_md", "en_core_web_lg"]
        
        for model_name in models_to_try:
            try:
                self.nlp = spacy.load(model_name)
                logger.info(f"SpaCy model '{model_name}' loaded successfully")
                return
            except OSError:
                logger.debug(f"SpaCy model '{model_name}' not found")
                continue
        
        logger.error("No spaCy model found. Install with: python -m spacy download en_core_web_sm")
    
    def _initialize_keybert(self):
        """Initialize KeyBERT with error handling"""
        self.keybert_model = None
        if not KEYBERT_AVAILABLE:
            logger.warning("KeyBERT not available. Keyphrase-based questions will be limited.")
            return
        
        try:
            # Try with different model configurations
            models_to_try = [
                'distilbert-base-nli-mean-tokens',
                'all-MiniLM-L6-v2',
                'paraphrase-albert-small-v2'
            ]
            
            for model_name in models_to_try:
                try:
                    self.keybert_model = KeyBERT(model_name)
                    logger.info(f"KeyBERT model '{model_name}' loaded successfully")
                    return
                except Exception as e:
                    logger.debug(f"Failed to load KeyBERT with {model_name}: {e}")
                    continue
            
            logger.warning("Could not initialize KeyBERT with any model")
            
        except Exception as e:
            logger.error(f"KeyBERT initialization failed: {e}")
    
    def _initialize_sentence_transformers(self):
        """Initialize sentence transformers"""
        self.sentence_model = None
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            logger.warning("SentenceTransformers not available. Semantic similarity will be limited.")
            return
        
        try:
            models_to_try = [
                'all-MiniLM-L6-v2',
                'paraphrase-albert-small-v2',
                'all-distilroberta-v1'
            ]
            
            for model_name in models_to_try:
                try:
                    self.sentence_model = SentenceTransformer(model_name)
                    logger.info(f"SentenceTransformer '{model_name}' loaded successfully")
                    return
                except Exception as e:
                    logger.debug(f"Failed to load SentenceTransformer {model_name}: {e}")
                    continue
            
            logger.warning("Could not initialize SentenceTransformer with any model")
            
        except Exception as e:
            logger.error(f"SentenceTransformer initialization failed: {e}")
    
    def _initialize_tfidf(self):
        """Initialize TF-IDF vectorizer"""
        self.tfidf_vectorizer = None
        if not SKLEARN_AVAILABLE:
            logger.warning("Scikit-learn not available. TF-IDF analysis will be limited.")
            return
        
        try:
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words='english',
                ngram_range=(1, 3),
                min_df=2,  # Ignore terms that appear in less than 2 documents
                max_df=0.95  # Ignore terms that appear in more than 95% of documents
            )
            logger.info("TF-IDF vectorizer initialized successfully")
        except Exception as e:
            logger.error(f"TF-IDF initialization failed: {e}")
    
    def _log_initialization_status(self):
        """Log the status of all NLP components"""
        components = [
            ('SpaCy NER', self.nlp is not None),
            ('KeyBERT', self.keybert_model is not None),
            ('SentenceTransformers', self.sentence_model is not None),
            ('TF-IDF', self.tfidf_vectorizer is not None)
        ]
        
        available_components = [name for name, available in components if available]
        unavailable_components = [name for name, available in components if not available]
        
        if available_components:
            logger.info(f"Available NLP components: {', '.join(available_components)}")
        if unavailable_components:
            logger.warning(f"Unavailable NLP components: {', '.join(unavailable_components)}")
        
        # Determine overall capability level
        total_components = len(components)
        available_count = len(available_components)
        capability_percentage = (available_count / total_components) * 100
        
        logger.info(f"NLP capability level: {capability_percentage:.0f}% ({available_count}/{total_components} components)")

    async def generate_questions_from_transcript(
        self,
        transcript: str,
        stream_id: int,
        num_mcq: int = 5,
        num_short_answer: int = 3
    ) -> Dict[str, Any]:
        """Generate questions from a lecture transcript"""

        try:
            if not transcript or len(transcript.strip()) < 200:
                return {"success": False, "error": "Transcript too short for question generation"}

            logger.info(f"Generating questions for stream {stream_id}")
            logger.info(f"Transcript length: {len(transcript)} characters")

            # Preprocess transcript
            processed_text = self._preprocess_text(transcript)

            # Extract sentences
            sentences = self._extract_sentences(processed_text)
            if len(sentences) < 5:
                return {"success": False, "error": "Not enough sentences for question generation"}

            # Extract named entities
            entities = self._extract_named_entities(processed_text)
            logger.info(f"Extracted {len(entities)} named entities")

            # Extract keyphrases
            keyphrases = self._extract_keyphrases(processed_text)
            logger.info(f"Extracted {len(keyphrases)} keyphrases")

            # Generate multiple choice questions
            mcq_questions = self._generate_multiple_choice_questions(
                sentences, entities, keyphrases, num_mcq
            )

            # Generate short answer questions
            short_answer_questions = self._generate_short_answer_questions(
                sentences, entities, keyphrases, num_short_answer
            )

            # Store questions in database
            db = SessionLocal()
            try:
                generated_questions = []

                # Store MCQ questions
                for mcq in mcq_questions:
                    question = GeneratedQuestion(
                        stream_id=stream_id,
                        question_type="multiple_choice",
                        question_text=mcq["question"],
                        correct_answer=mcq["correct_answer"],
                        options=mcq["options"],
                        difficulty_level=mcq.get("difficulty", "medium"),
                        topic_tags=mcq.get("topics", []),
                        source_sentence=mcq.get("source_sentence", ""),
                        confidence_score=mcq.get("confidence", 0.7)
                    )
                    db.add(question)
                    generated_questions.append(question)

                # Store short answer questions
                for sa in short_answer_questions:
                    question = GeneratedQuestion(
                        stream_id=stream_id,
                        question_type="short_answer",
                        question_text=sa["question"],
                        correct_answer=sa["answer"],
                        options=[],
                        difficulty_level=sa.get("difficulty", "medium"),
                        topic_tags=sa.get("topics", []),
                        source_sentence=sa.get("source_sentence", ""),
                        confidence_score=sa.get("confidence", 0.7)
                    )
                    db.add(question)
                    generated_questions.append(question)

                db.commit()

                result = {
                    "success": True,
                    "questions_generated": len(generated_questions),
                    "multiple_choice_questions": mcq_questions,
                    "short_answer_questions": short_answer_questions,
                    "entities_found": len(entities),
                    "keyphrases_found": len(keyphrases),
                    "processing_stats": {
                        "transcript_length": len(transcript),
                        "sentences_processed": len(sentences),
                        "entities_extracted": len(entities),
                        "keyphrases_extracted": len(keyphrases)
                    }
                }

                logger.info(
                    f"Successfully generated {len(generated_questions)} questions for stream {stream_id}")
                return result

            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            return {"success": False, "error": str(e)}

    async def generate_questions_from_document(
        self,
        document_content: str,
        document_id: int,
        course_id: int,
        num_mcq: int = 5,
        num_short_answer: int = 3
    ) -> Dict[str, Any]:
        """Generate questions from a document content"""

        try:
            if not document_content or len(document_content.strip()) < 200:
                return {"success": False, "error": "Document content too short for question generation"}

            logger.info(f"Generating questions for document {document_id} in course {course_id}")
            logger.info(f"Document content length: {len(document_content)} characters")

            # Preprocess document content
            processed_text = self._preprocess_text(document_content)

            # Extract sentences
            sentences = self._extract_sentences(processed_text)
            if len(sentences) < 5:
                return {"success": False, "error": "Not enough sentences for question generation"}

            # Extract named entities
            entities = self._extract_named_entities(processed_text)
            logger.info(f"Extracted {len(entities)} named entities")

            # Extract keyphrases
            keyphrases = self._extract_keyphrases(processed_text)
            logger.info(f"Extracted {len(keyphrases)} keyphrases")

            # Generate multiple choice questions
            mcq_questions = self._generate_multiple_choice_questions(
                sentences, entities, keyphrases, num_mcq
            )

            # Generate short answer questions
            short_answer_questions = self._generate_short_answer_questions(
                sentences, entities, keyphrases, num_short_answer
            )

            # Store questions in database
            db = SessionLocal()
            try:
                generated_questions = []

                # Store MCQ questions
                for mcq in mcq_questions:
                    question = GeneratedQuestion(
                        document_id=document_id,  # Link to document instead of stream
                        course_id=course_id,      # Direct course reference
                        question_type="multiple_choice",
                        question_text=mcq["question"],
                        correct_answer=mcq["correct_answer"],
                        options=mcq["options"],
                        difficulty_level=mcq.get("difficulty", "medium"),
                        topic_tags=mcq.get("topics", []),
                        source_sentence=mcq.get("source_sentence", ""),
                        confidence_score=mcq.get("confidence", 0.7)
                    )
                    db.add(question)
                    generated_questions.append(question)

                # Store short answer questions
                for sa in short_answer_questions:
                    question = GeneratedQuestion(
                        document_id=document_id,  # Link to document instead of stream
                        course_id=course_id,      # Direct course reference
                        question_type="short_answer",
                        question_text=sa["question"],
                        correct_answer=sa["answer"],
                        options=[],
                        difficulty_level=sa.get("difficulty", "medium"),
                        topic_tags=sa.get("topics", []),
                        source_sentence=sa.get("source_sentence", ""),
                        confidence_score=sa.get("confidence", 0.7)
                    )
                    db.add(question)
                    generated_questions.append(question)

                db.commit()

                result = {
                    "success": True,
                    "questions_generated": len(generated_questions),
                    "multiple_choice_questions": mcq_questions,
                    "short_answer_questions": short_answer_questions,
                    "entities_found": len(entities),
                    "keyphrases_found": len(keyphrases),
                    "processing_stats": {
                        "document_length": len(document_content),
                        "sentences_processed": len(sentences),
                        "entities_extracted": len(entities),
                        "keyphrases_extracted": len(keyphrases)
                    }
                }

                logger.info(
                    f"Successfully generated {len(generated_questions)} questions for document {document_id}")
                return result

            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error generating questions from document: {e}")
            return {"success": False, "error": str(e)}

    def _preprocess_text(self, text: str) -> str:
        """Preprocess transcript text"""
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())

        # Remove common transcription artifacts
        text = re.sub(r'\[.*?\]', '', text)  # Remove bracketed text
        text = re.sub(r'\(.*?\)', '', text)  # Remove parenthetical text

        # Fix common transcription issues
        text = re.sub(r'\b(um|uh|ah|er)\b', '', text, flags=re.IGNORECASE)

        return text

    def _extract_sentences(self, text: str) -> List[str]:
        """Extract meaningful sentences from text"""
        if self.nlp:
            doc = self.nlp(text)
            sentences = [sent.text.strip() for sent in doc.sents]
        elif NLTK_AVAILABLE:
            # Fallback to NLTK
            sentences = nltk.sent_tokenize(text)
        else:
            # Simple sentence splitting as last resort
            sentences = [s.strip() for s in text.split('.') if s.strip()]

        # Filter out very short or very long sentences
        filtered_sentences = []
        for sentence in sentences:
            if 10 <= len(sentence.split()) <= 50:  # 10-50 words
                filtered_sentences.append(sentence)

        return filtered_sentences

    def _extract_named_entities(self, text: str) -> List[Dict[str, str]]:
        """Extract named entities using spaCy NER"""
        entities = []

        if not self.nlp:
            return entities

        try:
            doc = self.nlp(text)

            for ent in doc.ents:
                # Filter relevant entity types for educational content
                if ent.label_ in ['PERSON', 'ORG', 'GPE', 'DATE', 'EVENT', 'WORK_OF_ART', 'LAW', 'LANGUAGE']:
                    entities.append({
                        'text': ent.text,
                        'label': ent.label_,
                        'start': ent.start_char,
                        'end': ent.end_char,
                        'description': spacy.explain(ent.label_) if SPACY_AVAILABLE else ent.label_
                    })

            # Remove duplicates
            unique_entities = []
            seen = set()
            for entity in entities:
                key = (entity['text'].lower(), entity['label'])
                if key not in seen:
                    seen.add(key)
                    unique_entities.append(entity)

            return unique_entities

        except Exception as e:
            logger.error(f"Error extracting named entities: {e}")
            return []

    def _extract_keyphrases(self, text: str) -> List[Dict[str, Any]]:
        """Extract keyphrases using KeyBERT or fallback methods"""
        keyphrases = []

        # Primary method: KeyBERT
        if self.keybert_model:
            try:
                keywords = self.keybert_model.extract_keywords(
                    text,
                    keyphrase_ngram_range=(1, 3),
                    stop_words='english',
                    top_k=20,
                    use_mmr=True,  # Use Maximal Marginal Relevance for diversity
                    diversity=0.5
                )

                for keyword, score in keywords:
                    keyphrases.append({
                        'phrase': keyword,
                        'score': float(score),
                        'word_count': len(keyword.split())
                    })

                logger.debug(f"KeyBERT extracted {len(keyphrases)} keyphrases")
                return keyphrases

            except Exception as e:
                logger.error(f"KeyBERT keyphrase extraction failed: {e}")

        # Fallback method 1: TF-IDF based extraction
        if self.tfidf_vectorizer and SKLEARN_AVAILABLE:
            try:
                keyphrases = self._extract_keyphrases_tfidf(text)
                if keyphrases:
                    logger.debug(f"TF-IDF extracted {len(keyphrases)} keyphrases")
                    return keyphrases
            except Exception as e:
                logger.error(f"TF-IDF keyphrase extraction failed: {e}")

        # Fallback method 2: Simple frequency-based extraction
        try:
            keyphrases = self._extract_keyphrases_frequency(text)
            logger.debug(f"Frequency-based extraction found {len(keyphrases)} keyphrases")
            return keyphrases
        except Exception as e:
            logger.error(f"Frequency-based keyphrase extraction failed: {e}")
            return []

    def _extract_keyphrases_tfidf(self, text: str) -> List[Dict[str, Any]]:
        """Extract keyphrases using TF-IDF"""
        if not self.tfidf_vectorizer or not SKLEARN_AVAILABLE:
            return []

        try:
            # Split text into sentences for TF-IDF analysis
            sentences = self._extract_sentences(text)
            if len(sentences) < 2:
                return []

            # Fit and transform
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(sentences)
            feature_names = self.tfidf_vectorizer.get_feature_names_out()
            
            # Get average TF-IDF scores
            mean_scores = tfidf_matrix.mean(axis=0).A1
            
            # Create keyphrases with scores
            keyphrases = []
            for i, score in enumerate(mean_scores):
                if score > 0.1:  # Minimum threshold
                    keyphrases.append({
                        'phrase': feature_names[i],
                        'score': float(score),
                        'word_count': len(feature_names[i].split())
                    })
            
            # Sort by score and return top 20
            keyphrases.sort(key=lambda x: x['score'], reverse=True)
            return keyphrases[:20]
            
        except Exception as e:
            logger.error(f"TF-IDF keyphrase extraction error: {e}")
            return []

    def _extract_keyphrases_frequency(self, text: str) -> List[Dict[str, Any]]:
        """Simple frequency-based keyphrase extraction as last resort"""
        try:
            # Basic preprocessing
            import re
            from collections import Counter
            
            # Remove punctuation and convert to lowercase
            clean_text = re.sub(r'[^\w\s]', ' ', text.lower())
            words = clean_text.split()
            
            # Remove common stop words
            stop_words = {
                'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
                'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
                'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
            }
            
            # Filter words
            filtered_words = [word for word in words if len(word) > 3 and word not in stop_words]
            
            # Get word frequencies
            word_freq = Counter(filtered_words)
            
            # Create bigrams and trigrams
            bigrams = [' '.join(filtered_words[i:i+2]) for i in range(len(filtered_words)-1)]
            trigrams = [' '.join(filtered_words[i:i+3]) for i in range(len(filtered_words)-2)]
            
            bigram_freq = Counter(bigrams)
            trigram_freq = Counter(trigrams)
            
            keyphrases = []
            
            # Add single words
            for word, freq in word_freq.most_common(10):
                keyphrases.append({
                    'phrase': word,
                    'score': freq / len(filtered_words),  # Normalize by text length
                    'word_count': 1
                })
            
            # Add bigrams
            for phrase, freq in bigram_freq.most_common(5):
                if freq > 1:  # Only include if appears more than once
                    keyphrases.append({
                        'phrase': phrase,
                        'score': freq / len(bigrams),
                        'word_count': 2
                    })
            
            # Add trigrams
            for phrase, freq in trigram_freq.most_common(5):
                if freq > 1:
                    keyphrases.append({
                        'phrase': phrase,
                        'score': freq / len(trigrams),
                        'word_count': 3
                    })
            
            # Sort by score
            keyphrases.sort(key=lambda x: x['score'], reverse=True)
            return keyphrases[:20]
            
        except Exception as e:
            logger.error(f"Frequency-based keyphrase extraction error: {e}")
            return []

    def _generate_multiple_choice_questions(
        self,
        sentences: List[str],
        entities: List[Dict],
        keyphrases: List[Dict],
        num_questions: int
    ) -> List[Dict[str, Any]]:
        """Generate multiple choice questions"""

        mcq_questions = []

        try:
            # Strategy 1: Entity-based questions
            entity_questions = self._generate_entity_questions(
                sentences, entities)
            mcq_questions.extend(entity_questions[:num_questions//2])

            # Strategy 2: Keyphrase-based questions
            keyphrase_questions = self._generate_keyphrase_questions(
                sentences, keyphrases)
            mcq_questions.extend(keyphrase_questions[:num_questions//2])

            # Strategy 3: Definition-based questions
            definition_questions = self._generate_definition_questions(
                sentences, keyphrases)
            mcq_questions.extend(definition_questions[:max(
                1, num_questions - len(mcq_questions))])

            # Limit to requested number
            return mcq_questions[:num_questions]

        except Exception as e:
            logger.error(f"Error generating MCQ questions: {e}")
            return []

    def _generate_entity_questions(self, sentences: List[str], entities: List[Dict]) -> List[Dict[str, Any]]:
        """Generate questions based on named entities"""
        questions = []

        for entity in entities[:10]:  # Limit to top 10 entities
            # Find sentences containing this entity
            relevant_sentences = [
                s for s in sentences
                if entity['text'].lower() in s.lower()
            ]

            if not relevant_sentences:
                continue

            sentence = random.choice(relevant_sentences)

            # Create fill-in-the-blank question
            question_text = sentence.replace(entity['text'], '______')

            # Generate distractors (wrong answers)
            distractors = self._generate_distractors(entity, entities)

            if len(distractors) >= 3:
                options = [entity['text']] + distractors[:3]
                random.shuffle(options)

                questions.append({
                    'question': f"Fill in the blank: {question_text}",
                    'options': options,
                    'correct_answer': entity['text'],
                    'difficulty': 'medium',
                    'topics': [entity['label']],
                    'source_sentence': sentence,
                    'confidence': 0.8
                })

        return questions

    def _generate_keyphrase_questions(self, sentences: List[str], keyphrases: List[Dict]) -> List[Dict[str, Any]]:
        """Generate questions based on keyphrases"""
        questions = []

        for keyphrase in keyphrases[:8]:  # Limit to top 8 keyphrases
            phrase = keyphrase['phrase']

            # Find sentences containing this keyphrase
            relevant_sentences = [
                s for s in sentences
                if phrase.lower() in s.lower()
            ]

            if not relevant_sentences:
                continue

            sentence = random.choice(relevant_sentences)

            # Create conceptual question
            question_text = f"Which concept is most closely related to: '{phrase}'?"

            # Generate options based on other keyphrases
            other_phrases = [kp['phrase']
                             for kp in keyphrases if kp['phrase'] != phrase]

            if len(other_phrases) >= 3:
                distractors = random.sample(other_phrases, 3)
                options = [phrase] + distractors
                random.shuffle(options)

                questions.append({
                    'question': question_text,
                    'options': options,
                    'correct_answer': phrase,
                    'difficulty': 'medium',
                    'topics': ['concept'],
                    'source_sentence': sentence,
                    'confidence': keyphrase['score']
                })

        return questions

    def _generate_definition_questions(self, sentences: List[str], keyphrases: List[Dict]) -> List[Dict[str, Any]]:
        """Generate definition-based questions"""
        questions = []

        # Look for definition patterns in sentences
        definition_patterns = [
            r'(.+) is (.+)',
            r'(.+) refers to (.+)',
            r'(.+) means (.+)',
            r'(.+) can be defined as (.+)'
        ]

        for sentence in sentences:
            for pattern in definition_patterns:
                match = re.search(pattern, sentence, re.IGNORECASE)
                if match:
                    term = match.group(1).strip()
                    definition = match.group(2).strip()

                    if 3 <= len(term.split()) <= 8 and 5 <= len(definition.split()) <= 20:
                        # Create "What is X?" question
                        question_text = f"What is {term}?"

                        # Generate distractors from other definitions
                        other_definitions = []
                        for other_sentence in sentences:
                            if other_sentence != sentence:
                                for other_pattern in definition_patterns:
                                    other_match = re.search(
                                        other_pattern, other_sentence, re.IGNORECASE)
                                    if other_match:
                                        other_definitions.append(
                                            other_match.group(2).strip())

                        if len(other_definitions) >= 3:
                            distractors = random.sample(other_definitions, 3)
                            options = [definition] + distractors
                            random.shuffle(options)

                            questions.append({
                                'question': question_text,
                                'options': options,
                                'correct_answer': definition,
                                'difficulty': 'hard',
                                'topics': ['definition'],
                                'source_sentence': sentence,
                                'confidence': 0.7
                            })

                            break  # One question per sentence

        return questions[:3]  # Limit definition questions

    def _generate_short_answer_questions(
        self,
        sentences: List[str],
        entities: List[Dict],
        keyphrases: List[Dict],
        num_questions: int
    ) -> List[Dict[str, Any]]:
        """Generate short answer questions"""

        questions = []

        try:
            # Strategy 1: "What" questions about key concepts
            what_questions = self._generate_what_questions(
                sentences, keyphrases)
            questions.extend(what_questions)

            # Strategy 2: "How" questions about processes
            how_questions = self._generate_how_questions(sentences)
            questions.extend(how_questions)

            # Strategy 3: "Why" questions about explanations
            why_questions = self._generate_why_questions(sentences)
            questions.extend(why_questions)

            return questions[:num_questions]

        except Exception as e:
            logger.error(f"Error generating short answer questions: {e}")
            return []

    def _generate_what_questions(self, sentences: List[str], keyphrases: List[Dict]) -> List[Dict[str, Any]]:
        """Generate 'What' questions"""
        questions = []

        for keyphrase in keyphrases[:5]:
            phrase = keyphrase['phrase']

            # Find explanatory sentences
            relevant_sentences = [
                s for s in sentences
                if phrase.lower() in s.lower() and len(s.split()) > 10
            ]

            if relevant_sentences:
                # Choose longest sentence
                sentence = max(relevant_sentences, key=len)

                questions.append({
                    'question': f"What is {phrase} and why is it important?",
                    'answer': sentence,
                    'difficulty': 'medium',
                    'topics': ['concept'],
                    'source_sentence': sentence,
                    'confidence': keyphrase['score']
                })

        return questions

    def _generate_how_questions(self, sentences: List[str]) -> List[Dict[str, Any]]:
        """Generate 'How' questions about processes"""
        questions = []

        # Look for process indicators
        process_indicators = ['process', 'method',
                              'approach', 'technique', 'procedure', 'algorithm']

        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(indicator in sentence_lower for indicator in process_indicators):
                if len(sentence.split()) > 15:  # Ensure substantial content
                    questions.append({
                        'question': f"How does this process work? Explain the key steps.",
                        'answer': sentence,
                        'difficulty': 'hard',
                        'topics': ['process'],
                        'source_sentence': sentence,
                        'confidence': 0.6
                    })

                    if len(questions) >= 2:  # Limit how questions
                        break

        return questions

    def _generate_why_questions(self, sentences: List[str]) -> List[Dict[str, Any]]:
        """Generate 'Why' questions about explanations"""
        questions = []

        # Look for causal or explanatory language
        causal_indicators = ['because', 'since',
                             'therefore', 'thus', 'consequently', 'as a result']

        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(indicator in sentence_lower for indicator in causal_indicators):
                if len(sentence.split()) > 12:
                    questions.append({
                        'question': f"Why is this relationship important? Explain the reasoning.",
                        'answer': sentence,
                        'difficulty': 'hard',
                        'topics': ['reasoning'],
                        'source_sentence': sentence,
                        'confidence': 0.7
                    })

                    if len(questions) >= 2:  # Limit why questions
                        break

        return questions

    def _generate_distractors(self, target_entity: Dict, all_entities: List[Dict]) -> List[str]:
        """Generate plausible wrong answers for multiple choice questions"""
        distractors = []

        # Get entities of the same type
        same_type_entities = [
            e['text'] for e in all_entities
            if e['label'] == target_entity['label'] and e['text'] != target_entity['text']
        ]

        # Add same-type entities as distractors
        distractors.extend(same_type_entities[:2])

        # Add some different type entities if needed
        if len(distractors) < 3:
            other_entities = [
                e['text'] for e in all_entities
                if e['text'] != target_entity['text'] and e['text'] not in distractors
            ]
            distractors.extend(other_entities[:3-len(distractors)])

        return distractors

    def get_questions_for_stream(self, stream_id: int) -> List[Dict[str, Any]]:
        """Get all generated questions for a stream"""
        db = SessionLocal()
        try:
            questions = db.query(GeneratedQuestion).filter(
                GeneratedQuestion.stream_id == stream_id
            ).all()

            return [
                {
                    'id': q.id,
                    'question_type': q.question_type,
                    'question_text': q.question_text,
                    'options': q.options,
                    'correct_answer': q.correct_answer,
                    'difficulty_level': q.difficulty_level,
                    'topic_tags': q.topic_tags,
                    'confidence_score': q.confidence_score,
                    'created_at': q.created_at
                }
                for q in questions
            ]
        finally:
            db.close()


# Global instance
question_generation_service = QuestionGenerationService()

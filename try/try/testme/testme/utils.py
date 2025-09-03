def calculate_qv_coins(attempt):
    base_score = 100
    difficulty_multiplier = {
        'Easy': 0.8,
        'Medium': 1.2,
        'Hard': 1.5
    }
    
    # Calculate the percentage of correct answers
    total_questions = attempt.questions.count()
    correct_percentage = (attempt.correct_answers / total_questions) if total_questions > 0 else 0
    
    # Time penalty: reward faster completion
    time_penalty = max(0, (attempt.time_limit - attempt.time_taken) / 10)
    
    # Calculate QV coins
    qv_coins = int(
        (base_score * total_questions * correct_percentage *
         difficulty_multiplier[attempt.difficulty]) + time_penalty
    )
    
    return qv_coins
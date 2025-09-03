from django.db.models.signals import post_save
from django.dispatch import receiver
from model.models import QuizAttempt

@receiver(post_save, sender=QuizAttempt)
def update_progress(sender, instance, **kwargs):
    user = instance.user
    main_topic = instance.questions.first().specific_master_topic.submaster_topic.master_topic
    
    # Unlock related topics
    related_topics = MasterTopic.objects.filter(
        submaster_topics__specific_master_topics__mcqs__quizattempt=instance
    ).distinct()
    
    user.progress.unlocked_topics.add(*related_topics)
    user.progress.save()
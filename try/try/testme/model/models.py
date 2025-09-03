from django.db import models
from django.contrib.auth.models import AbstractUser

class MCQ(models.Model):
    DIFFICULTY_CHOICES = [
        ('Hard', 'Hard'),
        ('Medium', 'Medium'),
        ('Easy', 'Easy'),
    ]
    question_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    time = models.IntegerField(null=True)
    difficulty = models.CharField(choices=DIFFICULTY_CHOICES, default='Easy', max_length=10)
    specific_master_topic = models.ForeignKey('SpecificMasterTopic', related_name='mcqs', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"MCQ created on {self.created_at}"

class MasterTopic(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class SubMasterTopic(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    master_topic = models.ForeignKey(MasterTopic, related_name='submaster_topics', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} (under {self.master_topic.name})"

class SpecificMasterTopic(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    submaster_topic = models.ForeignKey(SubMasterTopic, related_name='specific_master_topics', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} (under {self.submaster_topic.name})"

class CustomUser(AbstractUser):
    streak = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    master_topics = models.ManyToManyField(MasterTopic, related_name='users', blank=True)
    submaster_topics = models.ManyToManyField(SubMasterTopic, related_name='users', blank=True)
    specific_master_topic = models.ForeignKey(SpecificMasterTopic, related_name='users', on_delete=models.SET_NULL, null=True, blank=True)

    # Add unique related_name for groups and user_permissions
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name='customuser_set',  # Unique related_name
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='customuser_set',  # Unique related_name
        related_query_name='user',
    )

    def __str__(self):
        return self.username


    
    
class QuizAttempt(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='attempts')
    questions = models.ManyToManyField(MCQ)
    difficulty = models.CharField(max_length=10)
    time_taken = models.IntegerField()  # In seconds
    correct_answers = models.IntegerField()
    qv_coins = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quiz attempt by {self.user.username} on {self.created_at}"
    
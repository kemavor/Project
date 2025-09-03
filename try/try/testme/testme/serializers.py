from rest_framework import serializers
from model.models import MCQ, QuizAttempt, CustomUser, MasterTopic, SubMasterTopic, SpecificMasterTopic

class MCQSerializer(serializers.ModelSerializer):
    class Meta:
        model = MCQ
        fields = '__all__'

class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'qv_coins', 'streak', 'level']

class MasterTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterTopic
        fields = '__all__'

class SubMasterTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubMasterTopic
        fields = '__all__'

class SpecificMasterTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpecificMasterTopic
        fields = '__all__'
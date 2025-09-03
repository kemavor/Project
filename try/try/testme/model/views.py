from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware.csrf import get_token
from .serializers import UserSerializer

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user is not None:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            # Set HTTP-only cookie for access token
            response = Response({"message": "Login successful"})
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=True,  # Set to True in production (HTTPS only)
                samesite='Lax',
                max_age=60 * 60,  # 1 hour
            )
            
            # Set CSRF token for security
            response['X-CSRFToken'] = get_token(request)
            return response
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        
        
class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logout successful"})
        response.delete_cookie('access_token')
        return response
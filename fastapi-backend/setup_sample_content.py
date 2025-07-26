#!/usr/bin/env python3
"""
Setup sample course content in S3 for ECHO testing
"""

import boto3
import os
from botocore.exceptions import ClientError


def setup_sample_content():
    """Upload sample course content to S3"""

    # Initialize S3 client
    s3_client = boto3.client(
        's3',
        region_name='us-east-1',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )

    bucket_name = 'visionware-lecture-courses'

    # Sample course content
    sample_content = {
        "courses/1/syllabus.txt": """
Machine Learning Fundamentals - Course Syllabus

Course Overview:
This course introduces students to the fundamental concepts and algorithms of machine learning.

Learning Objectives:
1. Understand basic machine learning concepts
2. Implement supervised learning algorithms
3. Apply unsupervised learning techniques
4. Evaluate model performance
5. Understand neural networks basics

Course Structure:
Week 1: Introduction to Machine Learning
Week 2: Supervised Learning - Linear Regression
Week 3: Supervised Learning - Classification
Week 4: Unsupervised Learning - Clustering
Week 5: Model Evaluation and Validation
Week 6: Neural Networks Introduction
Week 7: Deep Learning Basics
Week 8: Final Project

Assessment:
- Assignments: 40%
- Midterm Exam: 25%
- Final Project: 25%
- Participation: 10%
""",

        "courses/1/lecture1_introduction.md": """
# Introduction to Machine Learning

## What is Machine Learning?

Machine Learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed.

## Types of Machine Learning

### 1. Supervised Learning
- Learning from labeled data
- Examples: Classification, Regression
- Algorithms: Linear Regression, Logistic Regression, Decision Trees

### 2. Unsupervised Learning
- Learning from unlabeled data
- Examples: Clustering, Dimensionality Reduction
- Algorithms: K-means, Principal Component Analysis

### 3. Reinforcement Learning
- Learning through interaction with environment
- Examples: Game playing, Robotics
- Algorithms: Q-Learning, Policy Gradient

## Key Concepts

### Features and Labels
- Features: Input variables (X)
- Labels: Output variables (y)
- Training data: {(x1, y1), (x2, y2), ..., (xn, yn)}

### Model Training Process
1. Data Collection
2. Data Preprocessing
3. Feature Engineering
4. Model Selection
5. Training
6. Evaluation
7. Deployment

## Applications

Machine Learning is used in:
- Healthcare: Disease diagnosis, Drug discovery
- Finance: Fraud detection, Risk assessment
- Marketing: Customer segmentation, Recommendation systems
- Transportation: Self-driving cars, Route optimization
""",

        "courses/1/assignment1.pdf": """
Assignment 1: Linear Regression Implementation

Due Date: Week 3
Points: 100

Objective:
Implement linear regression from scratch and apply it to a real-world dataset.

Tasks:
1. Implement gradient descent algorithm
2. Create linear regression model
3. Train on housing price dataset
4. Evaluate model performance
5. Write analysis report

Dataset:
- Boston Housing Dataset
- Features: 13 numerical features
- Target: House prices

Deliverables:
1. Python code implementation
2. Jupyter notebook with analysis
3. Written report (max 5 pages)
4. Presentation slides

Grading Criteria:
- Code correctness: 30%
- Analysis quality: 30%
- Report clarity: 25%
- Presentation: 15%
""",

        "courses/2/syllabus.txt": """
Data Science Essentials - Course Syllabus

Course Overview:
This course covers the essential tools and techniques for data science and analytics.

Learning Objectives:
1. Master data manipulation and analysis
2. Learn statistical analysis methods
3. Develop data visualization skills
4. Understand data preprocessing
5. Apply machine learning techniques

Course Structure:
Week 1: Introduction to Data Science
Week 2: Python for Data Science
Week 3: Data Manipulation with Pandas
Week 4: Data Visualization
Week 5: Statistical Analysis
Week 6: Data Preprocessing
Week 7: Machine Learning Applications
Week 8: Final Project

Assessment:
- Labs: 30%
- Assignments: 30%
- Final Project: 30%
- Participation: 10%
""",

        "courses/2/python_basics.txt": """
Python for Data Science - Basics

## Python Fundamentals

### Variables and Data Types
```python
# Numbers
x = 10          # integer
y = 3.14        # float
z = 2 + 3j      # complex

# Strings
name = "Data Science"
message = 'Hello, World!'

# Lists
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14, True]

# Dictionaries
person = {
    "name": "John",
    "age": 30,
    "city": "New York"
}
```

### Control Structures
```python
# If statements
if x > 5:
    print("x is greater than 5")
elif x == 5:
    print("x equals 5")
else:
    print("x is less than 5")

# Loops
for i in range(5):
    print(i)

while x > 0:
    print(x)
    x -= 1
```

### Functions
```python
def greet(name):
    return f"Hello, {name}!"

def calculate_average(numbers):
    return sum(numbers) / len(numbers)
```

## Data Science Libraries

### NumPy
- Numerical computing
- Array operations
- Mathematical functions

### Pandas
- Data manipulation
- Data analysis
- Data cleaning

### Matplotlib/Seaborn
- Data visualization
- Plotting
- Statistical graphics

### Scikit-learn
- Machine learning
- Model training
- Evaluation metrics
"""
    }

    try:
        # Upload each file
        for key, content in sample_content.items():
            print(f"Uploading {key}...")

            # Determine content type based on file extension
            if key.endswith('.txt'):
                content_type = 'text/plain'
            elif key.endswith('.md'):
                content_type = 'text/markdown'
            elif key.endswith('.pdf'):
                content_type = 'application/pdf'
            else:
                content_type = 'text/plain'

            # Upload to S3
            s3_client.put_object(
                Bucket=bucket_name,
                Key=key,
                Body=content.encode('utf-8'),
                ContentType=content_type
            )

            print(f"✅ Successfully uploaded {key}")

        print("\n🎉 Sample course content uploaded successfully!")
        print("ECHO can now access and analyze this content.")

    except ClientError as e:
        print(f"❌ Error uploading content: {e}")
        return False

    return True


if __name__ == "__main__":
    setup_sample_content()

from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), unique=True, index=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    faculty = Column(String(100), nullable=False)
    group = Column(String(20), nullable=False)
    enrollment_year = Column(Integer, nullable=False)
    created_at = Column(Date, default=func.current_date())
    
    # определение связи с оценками
    grades = relationship("Grade", back_populates="student", cascade="all, delete-orphan")

class Grade(Base):
    __tablename__ = "grades"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    grade = Column(Integer, nullable=False)  # Оценка от 2 до 5
    date = Column(Date, default=func.current_date())
    teacher = Column(String(100))
    semester = Column(Integer, nullable=False)  # Семестр (1-8)
    
    # Связь со студентом
    student = relationship("Student", back_populates="grades")
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

# Enums
class GenderEnum(str, Enum):
    male = "male"
    female = "female"

# Базовые схемы
class StudentBase(BaseModel):
    student_id: str = Field(..., min_length=5, max_length=20, description="Уникальный номер студента")
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    date_of_birth: date
    gender: GenderEnum
    faculty: str = Field(..., min_length=2, max_length=100)
    group: str = Field(..., min_length=2, max_length=20)
    enrollment_year: int = Field(..., ge=2000, le=2100)

class GradeBase(BaseModel):
    subject: str = Field(..., min_length=2, max_length=100)
    grade: int = Field(..., ge=2, le=5)
    teacher: Optional[str] = Field(None, max_length=100)
    semester: int = Field(..., ge=1, le=8)
    
    @validator('grade')
    def validate_grade(cls, v):
        if v not in [2, 3, 4, 5]:
            raise ValueError('Grade must be between 2 and 5')
        return v

# Схемы для создания
class StudentCreate(StudentBase):
    pass

class GradeCreate(GradeBase):
    student_id: int

# Схемы для обновления
class StudentUpdate(BaseModel):
    phone: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    email: Optional[EmailStr] = None
    faculty: Optional[str] = Field(None, min_length=2, max_length=100)
    group: Optional[str] = Field(None, min_length=2, max_length=20)

class GradeUpdate(BaseModel):
    grade: Optional[int] = Field(None, ge=2, le=5)
    teacher: Optional[str] = Field(None, max_length=100)

# Схемы для ответов
class GradeResponse(GradeBase):
    id: int
    student_id: int
    date: date
    
    class Config:
        from_attributes = True

class StudentResponse(StudentBase):
    id: int
    created_at: date
    average_grade: Optional[float] = None
    total_grades: Optional[int] = None
    
    class Config:
        from_attributes = True

class StudentWithGrades(StudentResponse):
    grades: List[GradeResponse] = []

# Агрегации и статистика
class StudentStats(BaseModel):
    student_id: int
    full_name: str
    average_grade: float
    total_grades: int
    excellent_grades: int
    good_grades: int
    satisfactory_grades: int
    unsatisfactory_grades: int

class FacultyStats(BaseModel):
    faculty: str
    total_students: int
    average_grade: float
    best_student: str
    worst_student: str

# Пагинация
class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    size: int
    pages: int
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from app import models, schemas

# CRUD для студентов
def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_student_by_email(db: Session, email: str):
    return db.query(models.Student).filter(models.Student.email == email).first()

def get_student_by_student_id(db: Session, student_id: str):
    return db.query(models.Student).filter(models.Student.student_id == student_id).first()

def get_students(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    faculty: Optional[str] = None,
    group: Optional[str] = None,
    enrollment_year: Optional[int] = None
):
    query = db.query(models.Student)
    
    if faculty:
        query = query.filter(models.Student.faculty.ilike(f"%{faculty}%"))
    if group:
        query = query.filter(models.Student.group == group)
    if enrollment_year:
        query = query.filter(models.Student.enrollment_year == enrollment_year)
    
    return query.offset(skip).limit(limit).all()

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student_update: schemas.StudentUpdate):
    db_student = get_student(db, student_id)
    if db_student:
        update_data = student_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_student, key, value)
        db.commit()
        db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int):
    db_student = get_student(db, student_id)
    if db_student:
        db.delete(db_student)
        db.commit()
    return db_student

# CRUD для оценок
def create_grade(db: Session, grade: schemas.GradeCreate):
    db_grade = models.Grade(**grade.dict())
    db.add(db_grade)
    db.commit()
    db.refresh(db_grade)
    return db_grade

def get_student_grades(db: Session, student_id: int, subject: Optional[str] = None, semester: Optional[int] = None):
    query = db.query(models.Grade).filter(models.Grade.student_id == student_id)
    
    if subject:
        query = query.filter(models.Grade.subject.ilike(f"%{subject}%"))
    if semester:
        query = query.filter(models.Grade.semester == semester)
    
    return query.all()

def update_grade(db: Session, grade_id: int, grade_update: schemas.GradeUpdate):
    db_grade = db.query(models.Grade).filter(models.Grade.id == grade_id).first()
    if db_grade:
        update_data = grade_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_grade, key, value)
        db.commit()
        db.refresh(db_grade)
    return db_grade

def delete_grade(db: Session, grade_id: int):
    db_grade = db.query(models.Grade).filter(models.Grade.id == grade_id).first()
    if db_grade:
        db.delete(db_grade)
        db.commit()
    return db_grade

# Агрегации и статистика
def calculate_student_average(db: Session, student_id: int) -> Optional[float]:
    result = db.query(
        func.avg(models.Grade.grade).label('average')
    ).filter(
        models.Grade.student_id == student_id
    ).first()
    
    return round(result.average, 2) if result.average else None

def get_student_stats(db: Session, student_id: int) -> Optional[Dict[str, Any]]:
    stats = db.query(
        func.count(models.Grade.id).label('total'),
        func.sum(models.Grade.grade == 5).label('excellent'),
        func.sum(models.Grade.grade == 4).label('good'),
        func.sum(models.Grade.grade == 3).label('satisfactory'),
        func.sum(models.Grade.grade == 2).label('unsatisfactory'),
        func.avg(models.Grade.grade).label('average')
    ).filter(
        models.Grade.student_id == student_id
    ).first()
    
    if stats.total == 0:
        return None
    
    return {
        "total_grades": stats.total,
        "excellent_grades": stats.excellent or 0,
        "good_grades": stats.good or 0,
        "satisfactory_grades": stats.satisfactory or 0,
        "unsatisfactory_grades": stats.unsatisfactory or 0,
        "average_grade": round(stats.average, 2) if stats.average else 0
    }

def get_faculty_stats(db: Session, faculty: str):
    # Получаем студентов факультета
    students = db.query(models.Student).filter(
        models.Student.faculty == faculty
    ).all()
    
    if not students:
        return None
    
    student_ids = [student.id for student in students]
    
    # Статистика по оценкам
    grades_stats = db.query(
        func.avg(models.Grade.grade).label('average'),
        func.count(models.Grade.id).label('total_grades')
    ).filter(
        models.Grade.student_id.in_(student_ids)
    ).first()
    
    # Находим лучшего студента по среднему баллу
    from sqlalchemy import desc
    
    # Подзапрос для средних баллов студентов
    subquery = db.query(
        models.Grade.student_id,
        func.avg(models.Grade.grade).label('avg_grade')
    ).group_by(
        models.Grade.student_id
    ).subquery()
    
    best_student_query = db.query(
        models.Student
    ).join(
        subquery, models.Student.id == subquery.c.student_id
    ).filter(
        models.Student.faculty == faculty
    ).order_by(
        desc(subquery.c.avg_grade)
    ).first()
    
    best_student = f"{best_student_query.first_name} {best_student_query.last_name}" if best_student_query else None
    
    return {
        "faculty": faculty,
        "total_students": len(students),
        "average_grade": round(grades_stats.average, 2) if grades_stats.average else 0,
        "total_grades": grades_stats.total_grades or 0,
        "best_student": best_student
    }

# Поиск
def search_students(db: Session, query: str):
    return db.query(models.Student).filter(
        or_(
            models.Student.first_name.ilike(f"%{query}%"),
            models.Student.last_name.ilike(f"%{query}%"),
            models.Student.email.ilike(f"%{query}%"),
            models.Student.student_id.ilike(f"%{query}%")
        )
    ).all()
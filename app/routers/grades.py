from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app import crud, schemas
from app.database import get_db

router = APIRouter()

# ✅ Эндпоинт 8: Получить оценки студента
@router.get("/student/{student_id}", response_model=List[schemas.GradeResponse])
def read_student_grades(
    student_id: int,
    subject: Optional[str] = Query(None, description="Фильтр по предмету"),
    semester: Optional[int] = Query(None, ge=1, le=8, description="Фильтр по семестру"),
    db: Session = Depends(get_db)
):
    """
    Получить все оценки студента с возможностью фильтрации.
    """
    grades = crud.get_student_grades(db, student_id=student_id, subject=subject, semester=semester)
    
    # Преобразуем в Pydantic модели
    grade_responses = []
    for grade in grades:
        grade_response = schemas.GradeResponse(
            id=grade.id,
            subject=grade.subject,
            grade=grade.grade,
            teacher=grade.teacher,
            semester=grade.semester,
            student_id=grade.student_id,
            date=grade.date
        )
        grade_responses.append(grade_response)
    
    return grade_responses

# ✅ Эндпоинт 9: Добавить оценку
@router.post("/", response_model=schemas.GradeResponse, status_code=status.HTTP_201_CREATED)
def create_grade(
    grade: schemas.GradeCreate,
    db: Session = Depends(get_db)
):
    """
    Добавить новую оценку студенту.
    """
    # Проверка существования студента
    student = crud.get_student(db, grade.student_id)
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Студент не найден"
        )
    
    created_grade = crud.create_grade(db=db, grade=grade)
    
    return schemas.GradeResponse(
        id=created_grade.id,
        subject=created_grade.subject,
        grade=created_grade.grade,
        teacher=created_grade.teacher,
        semester=created_grade.semester,
        student_id=created_grade.student_id,
        date=created_grade.date
    )

# ✅ Эндпоинт 10: Обновить оценку
@router.put("/{grade_id}", response_model=schemas.GradeResponse)
def update_grade(
    grade_id: int,
    grade_update: schemas.GradeUpdate,
    db: Session = Depends(get_db)
):
    """
    Обновить оценку.
    """
    updated_grade = crud.update_grade(db, grade_id=grade_id, grade_update=grade_update)
    if updated_grade is None:
        raise HTTPException(
            status_code=404,
            detail="Оценка не найдена"
        )
    
    return schemas.GradeResponse(
        id=updated_grade.id,
        subject=updated_grade.subject,
        grade=updated_grade.grade,
        teacher=updated_grade.teacher,
        semester=updated_grade.semester,
        student_id=updated_grade.student_id,
        date=updated_grade.date
    )

# ✅ Эндпоинт 11: Удалить оценку
@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db)
):
    """
    Удалить оценку.
    """
    db_grade = crud.delete_grade(db, grade_id=grade_id)
    if db_grade is None:
        raise HTTPException(
            status_code=404,
            detail="Оценка не найдена"
        )
    return None

# ✅ Эндпоинт 12: Средний балл студента
@router.get("/student/{student_id}/average")
def get_student_average(
    student_id: int,
    semester: Optional[int] = Query(None, ge=1, le=8, description="Фильтр по семестру"),
    db: Session = Depends(get_db)
):
    """
    Получить средний балл студента.
    """
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Студент не найден"
        )
    
    if semester:
        # Рассчитываем средний балл за конкретный семестр
        from sqlalchemy import func
        from app.models import Grade
        
        result = db.query(
            func.avg(Grade.grade).label('average')
        ).filter(
            Grade.student_id == student_id,
            Grade.semester == semester
        ).first()
        
        average = round(result.average, 2) if result.average else 0
    else:
        # Средний балл за все время
        average = crud.calculate_student_average(db, student_id) or 0
    
    return {
        "student_id": student_id,
        "full_name": f"{student.first_name} {student.last_name}",
        "semester": semester,
        "average_grade": average
    }

# ✅ Эндпоинт 13: Топ студентов по среднему баллу
@router.get("/top/{faculty}")
def get_top_students(
    faculty: str,
    limit: int = Query(10, ge=1, le=50, description="Количество студентов в топе"),
    db: Session = Depends(get_db)
):
    """
    Получить топ студентов факультета по среднему баллу.
    """
    from sqlalchemy import func
    from app.models import Student, Grade
    
    # Подзапрос для средних баллов
    subquery = db.query(
        Grade.student_id,
        func.avg(Grade.grade).label('avg_grade'),
        func.count(Grade.id).label('total_grades')
    ).group_by(
        Grade.student_id
    ).subquery()
    
    # Основной запрос
    top_students = db.query(
        Student,
        subquery.c.avg_grade,
        subquery.c.total_grades
    ).join(
        subquery, Student.id == subquery.c.student_id
    ).filter(
        Student.faculty == faculty,
        subquery.c.total_grades >= 3  # Минимум 3 оценки для рейтинга
    ).order_by(
        subquery.c.avg_grade.desc()
    ).limit(limit).all()
    
    result = []
    for student, avg_grade, total_grades in top_students:
        result.append({
            "id": student.id,
            "full_name": f"{student.first_name} {student.last_name}",
            "group": student.group,
            "average_grade": round(avg_grade, 2) if avg_grade else 0,
            "total_grades": total_grades or 0
        })
    
    return {
        "faculty": faculty,
        "top_students": result
    }

# ✅ Эндпоинт 14: Успеваемость по предметам
@router.get("/subjects/performance")
def get_subjects_performance(
    semester: Optional[int] = Query(None, ge=1, le=8),
    db: Session = Depends(get_db)
):
    """
    Получить статистику успеваемости по предметам.
    """
    from sqlalchemy import func
    from app.models import Grade
    
    query = db.query(
        Grade.subject,
        func.avg(Grade.grade).label('avg_grade'),
        func.count(Grade.id).label('total_grades'),
        func.sum(Grade.grade == 5).label('excellent'),
        func.sum(Grade.grade == 4).label('good'),
        func.sum(Grade.grade == 3).label('satisfactory'),
        func.sum(Grade.grade == 2).label('unsatisfactory')
    )
    
    if semester:
        query = query.filter(Grade.semester == semester)
    
    results = query.group_by(Grade.subject).all()
    
    performance = []
    for row in results:
        total = row.total_grades or 0
        success_count = (row.excellent or 0) + (row.good or 0)
        success_rate = round((success_count / total * 100), 2) if total > 0 else 0
        
        performance.append({
            "subject": row.subject,
            "average_grade": round(row.avg_grade, 2) if row.avg_grade else 0,
            "total_grades": total,
            "excellent": row.excellent or 0,
            "good": row.good or 0,
            "satisfactory": row.satisfactory or 0,
            "unsatisfactory": row.unsatisfactory or 0,
            "success_rate": success_rate
        })
    
    return {
        "semester": semester,
        "subjects_performance": sorted(performance, key=lambda x: x['average_grade'], reverse=True)
    }
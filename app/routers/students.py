from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app import crud, schemas, models
from app.database import get_db

router = APIRouter()

# ✅ Эндпоинт 1: Получить список студентов с пагинацией и фильтрацией
@router.get("/", response_model=schemas.PaginatedResponse)
def read_students(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Смещение для пагинации"),
    limit: int = Query(100, ge=1, le=100, description="Количество записей"),
    faculty: Optional[str] = Query(None, description="Фильтр по факультету"),
    group: Optional[str] = Query(None, description="Фильтр по группе"),
    enrollment_year: Optional[int] = Query(None, ge=2000, le=2100, description="Фильтр по году поступления"),
    sort_by: Optional[str] = Query("last_name", description="Поле для сортировки"),
    sort_order: Optional[str] = Query("asc", description="Порядок сортировки (asc/desc)")
):
    """
    Получить список студентов с возможностью фильтрации, сортировки и пагинации.
    """
    # Получаем студентов
    students = crud.get_students(
        db, skip=skip, limit=limit,
        faculty=faculty, group=group, enrollment_year=enrollment_year
    )
    
    # Сортировка
    if sort_by in ["last_name", "first_name", "enrollment_year", "created_at"]:
        students.sort(
            key=lambda x: getattr(x, sort_by),
            reverse=(sort_order.lower() == "desc")
        )
    
    # Добавляем средний балл каждому студенту
    for student in students:
        avg_grade = crud.calculate_student_average(db, student.id)
        student.average_grade = avg_grade
        student.total_grades = len(student.grades)
    
    # Общее количество студентов (для пагинации)
    total_query = db.query(models.Student)
    if faculty:
        total_query = total_query.filter(models.Student.faculty.ilike(f"%{faculty}%"))
    if group:
        total_query = total_query.filter(models.Student.group == group)
    if enrollment_year:
        total_query = total_query.filter(models.Student.enrollment_year == enrollment_year)
    
    total = total_query.count()
    
    return {
        "items": students,
        "total": total,
        "page": skip // limit + 1,
        "size": limit,
        "pages": (total + limit - 1) // limit
    }

# ✅ Эндпоинт 2: Создать нового студента
@router.post("/", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db)
):
    """
    Создать нового студента.
    """
    # Проверка уникальности email
    db_student = crud.get_student_by_email(db, email=student.email)
    if db_student:
        raise HTTPException(
            status_code=400,
            detail="Email уже зарегистрирован"
        )
    
    # Проверка уникальности student_id
    db_student = crud.get_student_by_student_id(db, student_id=student.student_id)
    if db_student:
        raise HTTPException(
            status_code=400,
            detail="Student ID уже существует"
        )
    
    return crud.create_student(db=db, student=student)

# ✅ Эндпоинт 3: Получить студента по ID
@router.get("/{student_id}", response_model=schemas.StudentWithGrades)
def read_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить информацию о студенте по его ID вместе с оценками.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if db_student is None:
        raise HTTPException(
            status_code=404,
            detail="Студент не найден"
        )
    
    # Добавляем статистику
    stats = crud.get_student_stats(db, student_id)
    if stats:
        db_student.average_grade = stats["average_grade"]
        db_student.total_grades = stats["total_grades"]
    
    return db_student

# ✅ Эндпоинт 4: Обновить информацию о студенте
@router.put("/{student_id}", response_model=schemas.StudentResponse)
def update_student(
    student_id: int,
    student_update: schemas.StudentUpdate,
    db: Session = Depends(get_db)
):
    """
    Обновить информацию о студенте.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if db_student is None:
        raise HTTPException(
            status_code=404,
            detail="Студент не найден"
        )
    
    # Проверка email на уникальность при обновлении
    if student_update.email and student_update.email != db_student.email:
        existing_student = crud.get_student_by_email(db, email=student_update.email)
        if existing_student:
            raise HTTPException(
                status_code=400,
                detail="Email уже используется другим студентом"
            )
    
    return crud.update_student(db=db, student_id=student_id, student_update=student_update)

# ✅ Эндпоинт 5: Удалить студента
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Удалить студента по ID.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if db_student is None:
        raise HTTPException(
            status_code=404,
            detail="Студент не найден"
        )
    
    crud.delete_student(db=db, student_id=student_id)
    return None

# ✅ Эндпоинт 6: Поиск студентов
@router.get("/search/", response_model=List[schemas.StudentResponse])
def search_students(
    query: str = Query(..., min_length=2, description="Строка для поиска"),
    db: Session = Depends(get_db)
):
    """
    Поиск студентов по имени, фамилии, email или student_id.
    """
    students = crud.search_students(db, query=query)
    
    # Добавляем средний балл
    for student in students:
        avg_grade = crud.calculate_student_average(db, student.id)
        student.average_grade = avg_grade
    
    return students

# ✅ Эндпоинт 7: Статистика по студенту
@router.get("/{student_id}/stats")
def get_student_statistics(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить детальную статистику по студенту.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if db_student is None:
        raise HTTPException(
            status_code=404,
            detail="Студент не найден"
        )
    
    stats = crud.get_student_stats(db, student_id)
    if not stats:
        raise HTTPException(
            status_code=404,
            detail="У студента нет оценок"
        )
    
    return {
        "student_id": student_id,
        "full_name": f"{db_student.first_name} {db_student.last_name}",
        **stats
    }

# ✅ Дополнительный эндпоинт: Статистика по факультету
@router.get("/faculty/{faculty}/stats")
def get_faculty_statistics(
    faculty: str,
    db: Session = Depends(get_db)
):
    """
    Получить статистику по факультету.
    """
    stats = crud.get_faculty_stats(db, faculty)
    if not stats:
        raise HTTPException(
            status_code=404,
            detail="Факультет не найден или нет данных"
        )
    
    return stats
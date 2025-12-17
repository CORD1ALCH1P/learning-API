from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import students, grades

# Создание таблиц при запуске
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создание таблиц
    Base.metadata.create_all(bind=engine)
    yield
    # Очистка при завершении (опционально)
    # Base.metadata.drop_all(bind=engine)

app = FastAPI(
    title="Student Journal API",
    description="API для учёта студентов и оценок. Расчёт среднего балла.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(students.router, prefix="/api/v1/students", tags=["Студенты"])
app.include_router(grades.router, prefix="/api/v1/grades", tags=["Оценки"])

@app.get("/")
async def root():
    return {
        "message": "Student Journal API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
import os

# Folder structure relative to the current directory (backend)
structure = {
    "config": [
        "db.js",
        "passport.js",
        "config.js"
    ],
    "controllers": [
        "authController.js",
        "employeeController.js",
        "attendanceController.js",
        "timeoffController.js",
        "salaryController.js"
    ],
    "middleware": [
        "auth.js",
        "rbac.js",
        "validate.js",
        "upload.js",
        "errorHandler.js"
    ],
    "models": [
        "User.js",
        "Employee.js",
        "Company.js",
        "Attendance.js",
        "TimeOff.js",
        "TimeOffAllocation.js",
        "Salary.js",
        "Counter.js"
    ],
    "routes": [
        "authRoutes.js",
        "employeeRoutes.js",
        "attendanceRoutes.js",
        "timeoffRoutes.js",
        "salaryRoutes.js"
    ],
    "services": [
        "idGenerator.js",
        "salaryCalculator.js",
        "emailService.js",
        "passwordGenerator.js"
    ],
    "validators": [
        "authValidator.js",
        "employeeValidator.js",
        "attendanceValidator.js",
        "timeoffValidator.js"
    ],
    "utils": [
        "constants.js",
        "helpers.js",
        "AppError.js"
    ],
    "uploads": []
}

# Root-level files
root_files = [
    "server.js"
]

def create_structure():
    print("Creating backend structure...\n")

    for folder, files in structure.items():
        os.makedirs(folder, exist_ok=True)
        print(f"📁 {folder}")

        for file in files:
            filepath = os.path.join(folder, file)
            if not os.path.exists(filepath):
                with open(filepath, "w", encoding="utf-8") as f:
                    pass
                print(f"   └── 📄 {file}")

    for file in root_files:
        if not os.path.exists(file):
            with open(file, "w", encoding="utf-8") as f:
                pass
            print(f"📄 {file}")

    print("\n✅ Backend structure created successfully!")

if __name__ == "__main__":
    create_structure()
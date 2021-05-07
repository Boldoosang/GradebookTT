from flask import Flask, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager, current_user
from sqlalchemy.exc import IntegrityError, OperationalError
import os
import json

from models import db, User, UserSemester, UserCourse, University

def create_app():
    app = Flask(__name__)
    try:
        app.config.from_object('config.dev')
    except:
        app.config['ENV'] = os.environ.get("ENV", default="")
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DBURI")
        app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")

    db.init_app(app)
    return app

app = create_app()
app.app_context().push()
jwt = JWTManager(app)


# Register a callback function that loades a user from your database whenever
# a protected route is accessed. This should return any python object on a
# successful lookup, or None if the lookup failed for any reason (for example
# if the user has been deleted from the database).
@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return User.query.filter_by(username=identity).one_or_none()

@app.route("/login", methods=["POST"])
def login():
    loginDetails = request.get_json()
    
    if loginDetails:
        if "username" in loginDetails and "password" in loginDetails:
            alreadyExists = User.query.filter_by(username=loginDetails["username"]).first()
            
            if not alreadyExists or not alreadyExists.checkPassword(loginDetails["password"]):
                return json.dumps({"error" : "Wrong username or password entered!"})

            if alreadyExists and alreadyExists.checkPassword(loginDetails["password"]):
                access_token = create_access_token(identity=loginDetails["username"])
                return json.dumps({"access_token" : access_token})

    return json.dumps({"error" : "Invalid login details supplied!"})
    

@app.route("/register", methods=["POST"])
def register():
    registrationData = request.get_json()

    if registrationData:
        if "username" in registrationData and "password" in registrationData and "confirmPassword" in registrationData:
            filteredUsername = registrationData["username"].replace(" ", "")
            if len(filteredUsername) < 5:
                return json.dumps({"error" : "Username too short!"})
            
            if registrationData["password"] != registrationData["confirmPassword"]:
                return json.dumps({"error" : "Passwords do not match!"})
            
            if len(registrationData["password"]) < 6:
                return json.dumps({"error" : "Password is too short!"})

            try:
                newUser = User(filteredUsername, registrationData["password"])
                db.session.add(newUser)
                db.session.commit()
                return json.dumps({"message" : "Sucesssfully registered!"})
            except IntegrityError:
                db.session.rollback()
                return json.dumps({"error" : "This user already exists!"})
            except OperationalError:
                print("Database not initialized!")
                return json.dumps({"error" : "Database has not been initialized! Please contact the administrator of the application!"})
            except:
                return json.dumps({"error" : "An unknown error has occurred!"})

    return json.dumps({"error" : "Invalid registration details supplied!"})

@app.route("/identify", methods=["GET"])
@jwt_required()
def identify():
    if current_user:
        return json.dumps({"username" : current_user.username})
    
    return json.dumps({"error" : "User is not logged in!"})


@app.route("/api/semesters", methods=["GET"])
@jwt_required()
def getUserSemesters():
    userSemesters = db.session.query(UserSemester).filter_by(userID = current_user.userID).all()

    if userSemesters:
        return json.dumps([userSemester.toDict() for userSemester in userSemesters])
    
    return json.dumps({"error" : "No enrolled semesters found for user!"})

@app.route("/api/semesters", methods=["POST"])
@jwt_required()
def enrollSemester():
    semesterDetails = request.get_json()

    if not semesterDetails:
        return json.dumps({"error" : "Invalid semester details supplied!"})

    if "semesterYear" in semesterDetails and "semesterTerm" in semesterDetails:
        outcome = current_user.enrollSemester(semesterYear = semesterDetails["semesterYear"], semesterTerm = semesterDetails["semesterTerm"])
        if outcome:
            return json.dumps({"message" : "Successfully enrolled in semester!"})

    return json.dumps({"error" : "Unable to enroll in semester!"})


@app.route("/api/semesters", methods=["DELETE"])
@jwt_required()
def unenrollSemester():
    semesterDetails = request.get_json()

    if not semesterDetails:
        return json.dumps({"error" : "Invalid semester details supplied!"})

    if "semesterYear" in semesterDetails and "semesterTerm" in semesterDetails:
        outcome = current_user.unenrollSemester(semesterYear = semesterDetails["semesterYear"], semesterTerm = semesterDetails["semesterTerm"])
        if outcome:
            return json.dumps({"message" : "Successfully unenrolled from semester!"})

    return json.dumps({"error" : "Unable to unenroll from semester!"})


@app.route("/api/semester/<userSemesterID>/courses", methods=["GET"])
@jwt_required()
def viewSemesterCourses(userSemesterID):
    if userSemesterID:
        foundSemester = db.session.query(UserSemester).filter_by(userID=current_user.userID, userSemesterID=userSemesterID).first()

        if not foundSemester:
            return json.dumps({"error" : "Semester not found!"})

        foundCourses = foundSemester.userCourses.filter_by(userSemesterID = foundSemester.userSemesterID).all()

        if not foundCourses:
            return json.dumps({"error" : "User is not enrolled in any courses for this semester!"})
        
        return json.dumps([foundCourse.toDict() for foundCourse in foundCourses])

    return json.dumps({"error" : "Unable to add course to semester!"})

@app.route("/api/semester/<userSemesterID>/courses", methods=["POST"])
@jwt_required()
def addCourse(userSemesterID):
    courseDetails = request.get_json()

    if not courseDetails:
        return json.dumps({"error" : "Invalid course details supplied!"})


    if "courseCode" in courseDetails and "courseName" in courseDetails:
        foundSemester = db.session.query(UserSemester).filter_by(userID=current_user.userID, userSemesterID=userSemesterID).first()

        if not foundSemester:
            return json.dumps({"error" : "Semester not found!"})

        foundCourse = foundSemester.userCourses.filter_by(userSemesterID = foundSemester.userSemesterID, courseCode = courseDetails["courseCode"]).first()

        if foundCourse:
            return json.dumps({"error" : "Course already exists for this semester!"})
        
        outcome = foundSemester.addCourse(courseCode = courseDetails["courseCode"], courseName = courseDetails["courseName"], credits = courseDetails["credits"], towardsSemesterGPA = courseDetails["towardsSemesterGPA"])

        if outcome:
            return json.dumps({"message" : "Successfully added course to semester!"})

    return json.dumps({"error" : "Unable to add course to semester!"})
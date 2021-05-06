from flask import Flask, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
import os
import json

from models import db, User

def initApp():
    app = Flask(__name__)
    app.config.from_object('config.dev')
    return app

app = initApp()
jwt = JWTManager(app)

@app.route("/", methods=["GET"])
def homepage():
    return "Hello World!"


@app.route("/login", methods=["POST"])
def login():
    user = request.get_json()
    print(user)
    return json.dumps("Success!")

@app.route("/register", methods=["POST"])
def register():
    registrationData = request.get_json()

    if "username" in registrationData and "password" in registrationData and "confirmPassword" in registrationData and "university" in registrationData:
        filteredUsername = registrationData["username"].strip()
        if len(filteredUsername) < 5:
            return json.dumps({"error" : "Username too short!"})
        
        if registrationData["password"] != registrationData["confirmPassword"]:
            return json.dumps({"error" : "Passwords do not match!"})
        
        if len(registrationData["password"]):
            return json.dumps({"error" : "Password is too short!"})
        
    
    return json.dumps({"error" : "Invalid registration details supplied!"})


if __name__ == "__main__":
    print('Application running in ' + app.config['ENV'] + ' mode!')
    app.run(host='0.0.0.0', port = 8080, debug = app.config['ENV']=='development')

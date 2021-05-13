async function sendRequest(url, method, data){
    try {
        let access_token = window.localStorage.getItem("access_token");

        let request = {
            "method" : method,
            "headers" : {
                "Authorization" : `Bearer ${access_token}`
            }
        }

        if (data){
            request = {
                "method" : method,
                "headers" : {
                    "Authorization" : `Bearer ${access_token}`,
                    "Content-Type" : "application/json"
                }
            }
            request.body = JSON.stringify(data);
        }


        let response = await fetch(url, request);
        let results = await response.json()

        return results;
    } catch (e){
        console.log(e)
        return {"error" : "An unexpected error has occurred!"};
    }
}


async function login(event){
    event.preventDefault();

    let form = event.target;

    let loginDetails = {
        "username" : form.elements["username"].value,
        "password" : form.elements["password"].value
    }

    form.reset();

    let result = await sendRequest("/login", "POST", loginDetails);
    let messageArea = document.querySelector("#userActionMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        window.localStorage.setItem("access_token", result["access_token"]);
        messageArea.innerHTML = `<b class="text-success text-center">Login successful!</b>`
        window.location = "/web"
    }
}

function logout(){
    accessToken = window.localStorage.getItem("access_token");

    if(accessToken){
        window.localStorage.removeItem('access_token');
        console.log("Succesfully logged out!")
    } else 
        console.log("You were not logged in!")
    
    identifyUserContext()

    window.location = `/web`
}

async function identifyUser(){
    let user = await sendRequest("/identify", "GET")

    if("username" in user){
        return user;
    } else {
        return {"error" : "User is not logged in or session has expired!"}
    }
}

async function identifyUserContext(){
    let user = await identifyUser();

    let userStateArea = document.querySelector("#userStateArea");
    let mainTabArea = document.querySelector("#mainTab");

    if("username" in user){
        userStateArea.innerHTML = `<a class="nav-link" href="#" onclick="logout()">Logout</a>`
        /*mainTabArea.innerHTML = `<li class="nav-item active" role="presentation">
                                    <a class="nav-link active" id="mainTab-home-tab" data-bs-toggle="pill" data-bs-target="#mainTab-home" type="button" role="tab">Home</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" onclick="profileHandler()" id="mainTab-profile-tab" data-bs-toggle="pill" data-bs-target="#mainTab-profile" type="button" role="tab">Profile</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" onclick="dashboardHandler()" id="mainTab-dashboard-tab" data-bs-toggle="pill" data-bs-target="#mainTab-dashboard" type="button" role="tab">Dashboard</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" onclick="gradeHandler()" id="mainTab-grades-tab" data-bs-toggle="pill" data-bs-target="#mainTab-grades" type="button" role="tab">Grades</a>
                                </li>`*/
    } else {
        userStateArea.innerHTML = `<a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#userStateAction">Login/Register</a>`
        /*mainTabArea.innerHTML = `<li class="nav-item" role="presentation">
                                    <a class="nav-link active" id="mainTab-home-tab" data-bs-toggle="pill" data-bs-target="#mainTab-home" type="button" role="tab">Home</a>
                                </li>`*/
    }
}

async function register(event){
    event.preventDefault();

    let form = event.target;

    let registrationDetails = {
        "username" : form.elements["username"].value,
        "password" : form.elements["password"].value,
        "confirmPassword" : form.elements["confirmPassword"].value
    }

    form.reset();

    let result = await sendRequest("/register", "POST", registrationDetails);
    let messageArea = document.querySelector("#userActionMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<b class="text-success text-center">Registration successful!</b>`
    }

}

async function profileHandler(){
    let user = await identifyUser();
    let profileContent = document.querySelector("#profileContent")

    if("error" in user){
        profileContent.innerHTML = `<div class="text-center text-white">
                                    <h2>User is not logged in!</h2>
                                    <p>${user["error"]}</p></div>`
    } else {
        profileContent.innerHTML = `
                    <h1>My Profile</h1>
                    <hr class="my-3">
                    
                    <div class="form-group my-3">
                        <label for="profile-username">Current Username</label>
                        <input type="text" class="form-control mt-2" id="profile-username" readonly disabled>
                    </div>

                    <div class="form-group my-3">
                        <label for="profile-universityName">Current University Grading Scheme</label>
                        <input type="text" class="form-control mt-2" id="profile-universityName" readonly disabled>
                    </div>

                    <a class="btn btn-primary w-100" data-bs-toggle="collapse" href="#changePasswordArea" role="button">
                        Change Password
                    </a>
                    
                    <div class="collapse mb-5" id="changePasswordArea">
                        <div class="card card-body bg-dark mt-3 border border-danger rounded">
                            <form onsubmit="changePassword(event)">
                                <div class="form-group my-3">
                                <label for="changePassword-oldPassword">Old Password</label>
                                <input type="password" class="form-control mt-2" name="oldPassword" id="changePassword-oldPassword" placeholder="Old Password" required>
                                </div>
                                <div class="form-group my-3">
                                <label for="changePassword-newPassword">Password</label>
                                <input type="password" class="form-control mt-2" name="password" id="changePassword-newPassword" placeholder="Password" required>
                                </div>
                                <div class="form-group my-3">
                                    <label for="changePassword-confirmPassword">Confirm Password</label>
                                    <input type="password" class="form-control mt-2" name="confirmPassword" id="changePassword-confirmPassword" placeholder="Confirm Password" required>
                                </div>
                                <span id="updatePasswordMessage"></span>
                                <button type="submit" class="float-end btn btn-danger mt-2">Change Password</button>
                            </form>
                        </div>
                    </div>

                    <a class="btn btn-primary w-100 my-2" data-bs-toggle="collapse" href="#changeUniversityArea" role="button">
                        Update University
                    </a>

                    <div class="collapse mb-5" id="changeUniversityArea">
                        <div class="card card-body bg-dark mt-3 border border-danger rounded">
                            <form onsubmit="updateUniversity(event)">
                                <div class="form-group my-3">
                                    <label for="updateUniversity-universityName">University</label>
                                    <select name="universityName" class="form-control mt-2" id="updateUniversity-universityName" required>
                                        <option>University of the West Indies</option>
                                        <option>4.0 GPA University</option>
                                    </select>
                                </div>
                                <span id="updateUniversityMessage"></span>
                                <button type="submit" class="float-end btn btn-danger mt-2">Update University</button>
                            </form>
                        </div>
                    </div>
                </div>`

        let usernameArea = document.querySelector("#profile-username")
        let universityArea = document.querySelector("#profile-universityName")
        usernameArea.setAttribute("placeholder", user.username)
        if(user.universityName == null){
            universityArea.setAttribute("placeholder", "Default 4.3 GPA Scheme")
        } else {
            universityArea.setAttribute("placeholder", user.universityName)
        }
        
    }
}

async function changePassword(event){
    event.preventDefault()

    let form = event.target;

    let newPasswordDetails = {
        "oldPassword" : form.elements["oldPassword"].value,
        "password" : form.elements["password"].value,
        "confirmPassword" : form.elements["confirmPassword"].value
    }

    form.reset();

    let result = await sendRequest("/profile/password", "PUT", newPasswordDetails);
    let messageArea = document.querySelector("#updatePasswordMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<b class="text-success text-center">Password updated successfully!</b>`
    }

}

async function updateUniversity(event){
    event.preventDefault()

    let form = event.target;

    let updatedUniversityDetails = {
        "universityName" : form.elements["universityName"].value,
    }

    form.reset();

    let result = await sendRequest("/profile/university", "PUT", updatedUniversityDetails);
    let messageArea = document.querySelector("#updateUniversityMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<b class="text-success text-center">University updated successfully!</b>`
    }
    
}

async function dashboardHandler(){
    let user = await identifyUser();
    let dashboardContent = document.querySelector("#dashboardContent")

    if("error" in user){
        dashboardContent.innerHTML = `<div class="text-center text-white">
                                    <h2>User is not logged in!</h2>
                                    <p>${user["error"]}</p>
                                    </div>`
    } else {
        dashboardContent.innerHTML = `<div class="d-flex align-items-start row">
                                        <div class="nav flex-column nav-pills col-md-3" id="v-pills-tab" role="tablist">
                                            <button class="nav-link" id="dashboard-semesters-tab" data-bs-toggle="pill" data-bs-target="#dashboard-semesters" type="button" role="tab">My Semesters</button>
                                            <button class="nav-link" id="dashboard-courses-tab" data-bs-toggle="pill" data-bs-target="#dashboard-courses" type="button" role="tab">My Courses</button>
                                        </div>
                                        <div class="tab-content col-md-9" id="v-pills-tabContent">
                                            <div class="tab-pane fade show active" id="defaultDashboardPage" role="tabpanel">
                                                <div class="text-center text-white">
                                                    <h2>Please select an option!</h2>
                                                    <p>From the left hand menu, please select a dashboard option.</p>
                                                </div>
                                            </div>
                                            <div class="tab-pane fade" id="dashboard-semesters" role="tabpanel"></div>
                                        </div>
                                    </div>`

        let dashboardSemesterTab = document.querySelector("#dashboard-semesters-tab")
        dashboardSemesterTab.addEventListener("click", mySemestersDashboard)
        
    }
}

async function mySemestersDashboard(){
    let userSemesters = await sendRequest("/api/semesters", "GET")
    let mySemestersDashboardArea = document.querySelector("#dashboard-semesters")
    let currentYear = new Date().getFullYear()

    let completeSemesterList = ""
    let completeSemesterListHTML = ""
    
    try {
        for(userSemester of userSemesters){
            completeSemesterList += `<option>${userSemester.semesterYear}, ${userSemester.semesterTerm}</option>`
            completeSemesterListHTML += `<li class="list-group-item m-0">${userSemester.semesterYear}, ${userSemester.semesterTerm}</li>`
        }
    } catch(e){
        completeSemesterList = `<option selected disabled>No enrolled semesters!</option>`
        completeSemesterListHTML = `<li class="list-group-item mx-0 py-2 bg-dark text-center text-white border border-secondary">No enrolled semesters!</li>`
    }

    mySemestersDashboardArea.innerHTML = `<div class="text-white">
                                            <h2>My Semesters</h2>
                                            <hr class="my-3">

                                            <div>
                                                <h5>Enrolled Semesters</h5>
                                                <div class="bg-secondary my-3 p-0">
                                                    <ul class="list-group-flush px-0 mb-0" id="dashboard-myEnrolledSemesters">${completeSemesterListHTML}</ul>
                                                </div>
                                            </div>
                                            
                                            <hr class="my-3">
                                            <h5>Semester Actions</h5>
                                            <a class="btn btn-success w-100 my-2" data-bs-toggle="collapse" href="#dashboard-mySemesters-enroll" role="button">
                                                Enroll in Semester
                                            </a>

                                            <div class="collapse mb-5" id="dashboard-mySemesters-enroll">
                                                <div class="card card-body bg-dark mt-3 border border-danger rounded">
                                                    <form onsubmit="enrollSemester(event)">
                                                        <div class="mb-3">
                                                            <label for="enrollSemester-semester" class="form-label">Semester</label>
                                                            <select class="form-select" name="semesterName" id="enrollSemester-semester">
                                                                <option value="1">Semester 1</option>
                                                                <option value="2">Semester 2</option>
                                                                <option value="3">Semester 3 (Summer)</option>
                                                            </select>
                                                        </div>
                                                        <div class="mb-3 row">
                                                            <div class="col">
                                                                <input type="number" name="semesterYearStart" min=2000 max=2050 class="form-control" value=${currentYear} id="enrollSemester-yearStart"> 
                                                            </div>
                                                            <div class="col">
                                                                <input type="number" name="semesterYearEnd" min=2001 max=2051 class="form-control" value=${currentYear+1} readonly disabled id="enrollSemester-yearEnd"> 
                                                            </div>
                                                        </div>
                                                        <span id="enrollSemesterMessage"></span>
                                                        <button type="submit" class="float-end btn btn-success">Enroll</button>
                                                    </form>
                                                </div>
                                            </div>


                                            <a class="btn btn-danger w-100 my-2" data-bs-toggle="collapse" href="#dashboard-mySemesters-unenroll" role="button">
                                                Unenroll from Semester
                                            </a>

                                            <div class="collapse mb-5" id="dashboard-mySemesters-unenroll">
                                                <div class="card card-body bg-dark mt-3 border border-danger rounded">
                                                    <form onsubmit="unenrollSemester(event)">
                                                        <div class="mb-3">
                                                            <label for="unenrollSemester-semester" class="form-label">Semester</label>
                                                            <select class="form-select" name="semesterName" id="unenrollSemester-semester">
                                                            </select>
                                                        </div>
                                                        <span id="unenrollSemesterMessage"></span>
                                                        <button type="submit" class="float-end btn btn-danger">Unenroll</button>
                                                    </form>
                                                </div>
                                            </div>
                                            <hr class="my-3">
                                        </div>`

    let semesterYearStart = document.querySelector("#enrollSemester-yearStart")
    let semesterYearEnd = document.querySelector("#enrollSemester-yearEnd")
    semesterYearStart.addEventListener("click", ()=> semesterYearEnd.value = parseInt(semesterYearStart.value) + 1)    
    let semesterList = document.querySelector("#unenrollSemester-semester")
    semesterList.innerHTML = completeSemesterList
}

async function enrollSemester(event){
    event.preventDefault()

    let form = event.target;

    let semesterDetails = {
        "semesterTerm" : form.elements["semesterName"].value,
        "semesterYear" : form.elements["semesterYearStart"].value
    }

    form.reset();

    let result = await sendRequest("/api/semesters", "POST", semesterDetails);
    let messageArea = document.querySelector("#enrollSemesterMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="h-100 text-success text-center">Successfully enrolled in semester!</b>
                                </div>`
        setTimeout(mySemestersDashboard, 3000);
    }
}

async function unenrollSemester(event){
    event.preventDefault()

    let form = event.target;

    let semesterDetails

    try {
        let chunks = form.elements["semesterName"].value.split(", ");

        let yearChunks = chunks[0].split("/");
        let termChunks = chunks[1].split("_");

        let semesterTerm = termChunks[1]
        let semesterYear = yearChunks[0]

        semesterDetails = {
            "semesterTerm" : semesterTerm,
            "semesterYear" : semesterYear
        }

    } catch(e) {
        console.log("Invalid semester entered!")
        return;
    }
    

    

    form.reset();

    let result = await sendRequest("/api/semesters", "DELETE", semesterDetails);
    let messageArea = document.querySelector("#unenrollSemesterMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="text-success text-center">Successfully unenrolled from semester!</b>
                                </div>`
        setTimeout(mySemestersDashboard, 3000);
    }
}


async function gradeHandler(){
    let user = await identifyUser();
    let gradeContent = document.querySelector("#gradeContent")

    if("error" in user){
        gradeContent.innerHTML = `<div class="text-center text-white">
                                    <h2>User is not logged in!</h2>
                                    <p>${user["error"]}</p></div>`
    } else {
        gradeContent.innerHTML = "testGrade"
    }
}

function main(){
    identifyUserContext()
}


window.addEventListener('DOMContentLoaded', main);
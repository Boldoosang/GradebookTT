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

        if("msg" in results){
            if(results["msg"] == "Signature verification failed" || results["msg"] == "Token has expired"){
                window.localStorage.removeItem('access_token');
                console.log("Session has expired!")
                window.location = "/"
                return;
            }
        }

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

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        window.localStorage.setItem("access_token", result["access_token"]);
        messageArea.innerHTML = `<b class="text-success text-center">Login successful!</b>`
        window.location = "/"
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

    window.location = `/`
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

    if("error" in result || "msg" in result){
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
                                    <div class="d-flex align-items-start row">
                                        <div class="nav flex-column nav-pills col-md-3 mb-3 border border-primary rounded p-0" id="v-pills-tab" role="tablist">
                                            <button class="nav-link active border-bottom border-primary rounded-0" id="profile-home-tab" data-bs-toggle="pill" data-bs-target="#profile-home" type="button" role="tab">Home</button>
                                            <button class="nav-link border-bottom border-primary rounded-0" id="profile-password-tab" data-bs-toggle="pill" data-bs-target="#profile-password" type="button" role="tab">Password</button>
                                            <button class="nav-link" id="profile-university-tab" data-bs-toggle="pill" data-bs-target="#profile-university" type="button" role="tab">University</button>
                                        </div>
                                        <div class="tab-content col-md-9 ps-3 mb-3" id="v-pills-tabContent">
                                            <div class="tab-pane fade ps-3 show active" id="profile-home" role="tabpanel">
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
                                            </div>
                                            <div class="tab-pane fade ps-3 mb-3" id="profile-password" role="tabpanel">
                                                <h1>My Password</h1>
                                                <hr class="my-3">
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
                                                    <div class="mb-1" id="updatePasswordMessage"></div>
                                                    <button type="submit" class="float-end btn btn-danger mt-2">Change Password</button>
                                                </form>

                                            </div>
                                            <div class="tab-pane fade ps-3 mb-3" id="profile-university" role="tabpanel">
                                                <h1>My University</h1>
                                                <hr class="my-3">
                                                <form onsubmit="updateUniversity(event)">
                                                    <div class="form-group my-3">
                                                        <label for="updateUniversity-universityName">University</label>
                                                        <select name="universityName" class="form-control mt-2" id="updateUniversity-universityName" required>
                                                            <option>University of the West Indies</option>
                                                            <option>4.0 GPA University</option>
                                                        </select>
                                                    </div>
                                                    <div class="mb-1" id="updateUniversityMessage"></div>
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

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<b class="text-success text-center">Password updated successfully!</b>`
        setTimeout(profileHandler, 3000);
    }

}

async function updateUniversity(event){
    event.preventDefault()

    let form = event.target;

    let updatedUniversityDetails = {
        "universityName" : form.elements["universityName"].value,
    }

    let result = await sendRequest("/profile/university", "PUT", updatedUniversityDetails);
    let messageArea = document.querySelector("#updateUniversityMessage")

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="text-success text-center">University updated successfully!</b>
                                </div>`
        setTimeout(profileHandler, 3000);
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
                                        <div class="nav flex-column nav-pills col-md-3 mb-3 border border-primary rounded p-0" id="v-pills-tab" role="tablist">
                                            <button class="nav-link border-bottom border-primary rounded-0" id="dashboard-semesters-tab" data-bs-toggle="pill" data-bs-target="#dashboard-semesters" type="button" role="tab">My Semesters</button>
                                            <button class="nav-link border-bottom border-primary rounded-0" id="dashboard-courses-tab" data-bs-toggle="pill" data-bs-target="#dashboard-courses" type="button" role="tab">My Courses</button>
                                            <button class="nav-link" id="dashboard-marks-tab" data-bs-toggle="pill" data-bs-target="#dashboard-marks" type="button" role="tab">My Marks</button>
                                        </div>
                                        <div class="tab-content col-md-9 ps-3" id="v-pills-tabContent">
                                            <div class="tab-pane fade show active" id="defaultDashboardPage" role="tabpanel">
                                                <div class="text-center text-white">
                                                    <h2>Please select an option!</h2>
                                                    <p>Please select a dashboard option.</p>
                                                </div>
                                            </div>
                                            <div class="tab-pane fade ps-3" id="dashboard-semesters" role="tabpanel"></div>
                                            <div class="tab-pane fade ps-3" id="dashboard-courses" role="tabpanel"></div>
                                            <div class="tab-pane fade ps-3" id="dashboard-marks" role="tabpanel"></div>
                                        </div>
                                    </div>`

        let dashboardSemesterTab = document.querySelector("#dashboard-semesters-tab")
        dashboardSemesterTab.addEventListener("click", mySemestersDashboard)

        let dashboardCoursesTab = document.querySelector("#dashboard-courses-tab")
        dashboardCoursesTab.addEventListener("click", myCoursesDashboard)

        let dashboardMarksTab = document.querySelector("#dashboard-marks-tab")
        dashboardMarksTab.addEventListener("click", myMarksDashboard)
        
    }
}

async function mySemestersDashboard(){
    let userSemesters = await sendRequest("/api/semesters", "GET")
    let mySemestersDashboardArea = document.querySelector("#dashboard-semesters")
    let currentYear = new Date().getFullYear()

    let completeSemesterList = ""
    let completeSemesterListHTML = ""
    
    try {
        userSemesters = userSemesters.sort((a, b) => {
            if (a.semesterYear < b.semesterYear)
                return 1;

            if(a.semesterYear == b.semesterYear){
                if (a.semesterTerm < b.semesterTerm)
                    return 1;
                else
                    return -1;
            }
                
            if (a.semesterYear > b.semesterYear)
                return -1;
        })
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
                                                        <div class="mb-1" id="enrollSemesterMessage"></div>
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
                                                        <div class="mb-1" id="unenrollSemesterMessage"></div>
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

async function getSemesterCourses(semesterID){
    let userCourseListingArea = document.querySelector(`#courses-courseListing-${semesterID}`);
    let userCourseData = await sendRequest(`/api/semesters/${semesterID}/courses`, "GET")

    let courseEntries = "";

    if("error" in userCourseData){
        courseEntries = `<li class="list-group-item text-center">You have not enrolled in any courses for this semester!</li>`
    } else {
        userCourseData = userCourseData.sort((a, b) => (a.courseCode > b.courseCode ? 1 : -1))

        for(userCourseDataEntry of userCourseData){
            let checkedStatus = ""
            let isTowardsGPA = "<span class='text-danger'>Not towards GPA</span>"

            if(userCourseDataEntry.towardsSemesterGPA){
                checkedStatus = "checked"
                isTowardsGPA = "<span class='text-success'>Towards GPA</span>"
            }

            courseEntries += `<li class=" list-group-item card w-100 mb-3">
                                    <div class="card-body">
                                        <h5 class="card-title">${userCourseDataEntry.courseCode}</h5>
                                        <h6 class="card-subtitle mb-3 text-muted">${userCourseDataEntry.courseName} - ${userCourseDataEntry.credits} Credits, ${isTowardsGPA}</h6>

                                        <button class="btn btn-danger" type="button" data-bs-toggle="collapse" data-bs-target="#removeCourse-${userCourseDataEntry.userCourseID}">Remove Course</button>
                                        <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#updateCourse-${userCourseDataEntry.userCourseID}">Update Course</button>

                                        <div class="collapse mt-3 p-4 bg-dark text-white rounded" id="removeCourse-${userCourseDataEntry.userCourseID}">
                                            <p>Are you sure you want to remove the course?</p>
                                            <div class="mb-1" id="removeCourseMessage-${userCourseDataEntry.userCourseID}"></div><br>
                                            <button type="button" onclick="leaveCourse(${userCourseDataEntry.userCourseID}, ${semesterID})" class="btn btn-danger">Remove Course</button>
                                            <button class="btn btn-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#removeCourse-${userCourseDataEntry.userCourseID}">Cancel</button>
                                        </div>

                                        <div class="collapse rounded" id="updateCourse-${userCourseDataEntry.userCourseID}">
                                            <form class="mt-3 p-4 bg-dark text-white rounded" onsubmit="updateCourse(event, ${userCourseDataEntry.userCourseID}, ${semesterID})">
                                                <div class="form-group mb-3">
                                                    <label for="updateCourse-courseName-${userCourseDataEntry.userCourseID}">Course Name</label>
                                                    <input type="text" class="mt-1 form-control" name="courseName" id="updateCourse-courseName-${userCourseDataEntry.userCourseID}" value="${userCourseDataEntry.courseName}" required>
                                                </div>

                                                <div class="row">
                                                    <div class="col form-group mb-3">
                                                        <label for="updateCourse-courseCode-${userCourseDataEntry.userCourseID}">Course Code</label>
                                                        <input type="text" class="mt-1 form-control" name="courseCode" id="updateCourse-courseCode-${userCourseDataEntry.userCourseID}" value="${userCourseDataEntry.courseCode}" required>
                                                    </div>
                                                    
                                                    <div class="col form-group mb-3">
                                                        <label for="updateCourse-credits-${userCourseDataEntry.userCourseID}">Credits</label>
                                                        <input type="number" class="mt-1 form-control" name="credits" id="updateCourse-credits-${userCourseDataEntry.userCourseID}" value="${userCourseDataEntry.credits}" default=3 min=0 max=9 required>
                                                    </div>
                                                </div>

                                                <div class="form-check mb-3">
                                                    <input type="checkbox" ${checkedStatus} name="towardsSemesterGPA" class="form-check-input" id="updateCourse-towardsSemGPA-${userCourseDataEntry.userCourseID}">
                                                    <label class="form-check-label" for="updateCourse-towardsSemGPA-${userCourseDataEntry.userCourseID}">Towards Semester GPA</label>
                                                </div>

                                                <div class="mb-1" id="updateCourseMessage-${userCourseDataEntry.userCourseID}"></div><br>
                                                <button type="submit" class="btn btn-primary">Update Course</button>
                                            </form>
                                        </div>
                                    </div>
                                </li>`
        }
    }

    userCourseListingArea.innerHTML = courseEntries;
}

async function leaveCourse(userCourseID, semesterID){
    let courseDetails = {
        "userCourseID" : userCourseID
    }
    
    let result = await sendRequest(`/api/semesters/${semesterID}/courses`, "DELETE", courseDetails);
    let messageArea = document.querySelector(`#removeCourseMessage-${userCourseID}`)

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="text-success text-center">Course removed successfully!</b>
                                </div>`
        setTimeout(myCoursesDashboard, 3000);
    }
}

async function updateCourse(event, userCourseID, semesterID){
    event.preventDefault();

    let form = event.target

    let updateDetails = {
        "userCourseID" : userCourseID,
        "courseCode" : form.elements["courseCode"].value,
        "courseName" : form.elements["courseName"].value,
        "credits" : form.elements["credits"].value,
        "towardsSemesterGPA" : form.elements["towardsSemesterGPA"].checked,
    }

    let result = await sendRequest(`/api/semesters/${semesterID}/courses`, "PUT", updateDetails);

    let messageArea = document.querySelector(`#updateCourseMessage-${userCourseID}`)

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="text-success text-center">Course updated successfully!</b>
                                </div>`
        setTimeout(myCoursesDashboard, 3000);
    }
}

async function enrollCourse(event, semesterID){
    event.preventDefault()

    let form = event.target

    let courseDetails = {
        "courseCode" : form.elements["courseCode"].value,
        "courseName" : form.elements["courseName"].value,
        "credits" : form.elements["credits"].value,
        "towardsSemesterGPA" : form.elements["towardsSemesterGPA"].checked
    }

    let result = await sendRequest(`/api/semesters/${semesterID}/courses`, "POST", courseDetails);
    let messageArea = document.querySelector(`#addCourseMessage-${semesterID}`)

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="text-success text-center">Course added successfully!</b>
                                </div>`
        setTimeout(myCoursesDashboard, 3000);
    }
}

async function myCoursesDashboard(){
    let userSemesters = await sendRequest("/api/semesters", "GET")
    let myCoursesDashboardArea = document.querySelector("#dashboard-courses")

    let completeSemesterListAccordion = ""

    try {
        userSemesters = userSemesters.sort((a, b) => {
            if (a.semesterYear < b.semesterYear)
                return 1;

            if(a.semesterYear == b.semesterYear){
                if (a.semesterTerm < b.semesterTerm)
                    return 1;
                else
                    return -1;
            }
                
            if (a.semesterYear > b.semesterYear)
                return -1;
        })

        for(userSemester of userSemesters){
            completeSemesterListAccordion += `<div class="accordion-item bg-dark">
                                                <h2 class="accordion-header" id="coursesSemesterList-${userSemester.userSemesterID}-header">
                                                    <button class="accordion-button text-dark collapsed" type="button" onclick="getSemesterCourses(${userSemester.userSemesterID})" data-bs-toggle="collapse" data-bs-target="#coursesSemesterList-${userSemester.userSemesterID}">
                                                        ${userSemester.semesterYear}, ${userSemester.semesterTerm}
                                                    </button>
                                                </h2>
                                                <div id="coursesSemesterList-${userSemester.userSemesterID}" class="accordion-collapse collapse" data-bs-parent="#dashboardCourses-semesters">
                                                    <div class="accordion-body collapsed bg-dark text-white border-end border-bottom border-start border-secondary">
                                                        <ul class="list-group" id="courses-courseListing-${userSemester.userSemesterID}"></ul>

                                                        <button class="btn btn-success mt-3" type="button" data-bs-toggle="collapse" data-bs-target="#semester-${userSemester.userSemesterID}-courseEnroll">
                                                            Add Course
                                                        </button>

                                                        <div class="collapse" id="semester-${userSemester.userSemesterID}-courseEnroll">
                                                            <div class="border border-success mt-3 p-4 rounded">
                                                                <form onsubmit="enrollCourse(event, ${userSemester.userSemesterID})">
                                                                    <div class="form-group mb-3">
                                                                        <label for="enrollCourse-courseName-${userSemester.userSemesterID}">Course Name</label>
                                                                        <input type="text" class="mt-1 form-control" name="courseName" id="enrollCourse-courseName-${userSemester.userSemesterID}" placeholder="eg: Individual Programming" required>
                                                                    </div>

                                                                    <div class="row">
                                                                        <div class="col form-group mb-3">
                                                                            <label for="enrollCourse-courseCode-${userSemester.userSemesterID}">Course Code</label>
                                                                            <input type="text" class="mt-1 form-control" name="courseCode" id="enrollCourse-courseCode-${userSemester.userSemesterID}" placeholder="eg: SUBJ 0000" required>
                                                                        </div>
                                                                        
                                                                        <div class="col form-group mb-3">
                                                                            <label for="enrollCourse-credits-${userSemester.userSemesterID}">Credits</label>
                                                                            <input type="number" class="mt-1 form-control" name="credits" id="enrollCourse-credits-${userSemester.userSemesterID}" placeholder="eg: 3" value=3 min=0 max=9 required>
                                                                        </div>
                                                                    </div>

                                                                    <div class="form-check mb-3">
                                                                        <input type="checkbox" name="towardsSemesterGPA" class="form-check-input" checked id="enrollCourse-towardsSemGPA-${userSemester.userSemesterID}">
                                                                        <label class="form-check-label" for="enrollCourse-towardsSemGPA-${userSemester.userSemesterID}">Towards Semester GPA</label>
                                                                    </div>
                                                                    <div class="mb-1" id="addCourseMessage-${userSemester.userSemesterID}"></div><br>
                                                                    <button type="submit" class="btn btn-success">Add Course</button>
                                                                </form>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>`
        }
    } catch(e){
        
        completeSemesterListAccordion = `<div class="accordion-item bg-dark">
                                            <p class="accordion-header mx-0 py-2 bg-dark text-center text-white border border-secondary" id="coursesSemesterList-noCourses">
                                                No enrolled semesters for courses! Enroll in a semester before continuing.
                                            </p>
                                        </div>`
    }

    myCoursesDashboardArea.innerHTML = `<div class="text-white">
                                            <h2>My Courses</h2>
                                            <hr class="my-3">
                                            <h5 class="mb-3">Enrolled Courses by Semester</h5>

                                            <div class="accordion bg-dark" id="dashboardCourses-semesters">${completeSemesterListAccordion}</div>

                                            <hr class="my-3">
                                        </div>`
}




async function myMarksDashboard(){
    let userSemesters = await sendRequest("/api/semesters", "GET")
    let myMarksDashboardArea = document.querySelector("#dashboard-marks")
    let completeSemesterList = ""
    let isDisabled = ""

    try {
        userSemesters = userSemesters.sort((a, b) => {
            if (a.semesterYear < b.semesterYear)
                return 1;

            if(a.semesterYear == b.semesterYear){
                if (a.semesterTerm < b.semesterTerm)
                    return 1;
                else
                    return -1;
            }
                
            if (a.semesterYear > b.semesterYear)
                return -1;
        })
        for(userSemester of userSemesters){
            completeSemesterList += `<option value="${userSemester.userSemesterID}">${userSemester.semesterYear}, ${userSemester.semesterTerm}</option>`
        }
    } catch(e){
        completeSemesterList = `<option selected disabled>No enrolled semesters!</option>`
        isDisabled = "disabled"
        completeSemesterListHTML = `<li class="list-group-item mx-0 py-2 bg-dark text-center text-white border border-secondary">No enrolled semesters!</li>`
    }

    myMarksDashboardArea.innerHTML = `<div class="text-white">
                                            <h2>My Marks</h2>
                                            <hr class="my-3">
                                            <div id="marksBody">
                                                <div id="marks-selectSemesterForm">
                                                    <h5 class="mb-3">Semester</h5>
                                                    <form onsubmit="marksGetCourses(event)">
                                                        <select name="selectedSemester" id="marks-selectSemester" class="form-select">
                                                            ${completeSemesterList}
                                                        </select>
                                                        <button type="submit" ${isDisabled} class="btn btn-success mt-3">Select Semester</button>
                                                    </form>
                                                </div>

                                                <hr class="my-3">

                                                <div id="marks-selectCourseForm"></div>
                                            </div>
                                      </div>`
}

async function marksGetCourses(event){
    event.preventDefault()
    let selectedSemester = event.target.elements["selectedSemester"].value
    let courseFormArea = document.querySelector("#marks-selectCourseForm")

    let semesterCourses = await sendRequest(`/api/semesters/${selectedSemester}/courses`, "GET");
    let completeSemesterCourseList = ""
    let isDisabled = ""

    try {
        semesterCourses = semesterCourses.sort((a, b) => (a.courseCode > b.courseCode ? 1 : -1))
        for(semesterCourse of semesterCourses){
            completeSemesterCourseList += `<option class="font-monospace" data-marks="${semesterCourse.marks}" value="${semesterCourse.userCourseID}">${semesterCourse.courseCode} - ${semesterCourse.courseName}</option>`
        }
    } catch(e){
        completeSemesterCourseList = `<option selected disabled>No added courses!</option>`
        isDisabled = "disabled"
    }

    courseFormArea.innerHTML = `<h5 class="mb-3">Course</h5>
                                <form onsubmit="loadMarksDashboard(event, ${selectedSemester})">
                                    <select name="selectedCourse" id="marks-selectCourse" class="form-select">
                                        ${completeSemesterCourseList}
                                    </select>
                                    <button type="submit" ${isDisabled} class="btn btn-success mt-3">Select Course</button>
                                </form>
                                <hr class="my-4">`
    
}

async function loadMarksDashboardListing(userSemesterID, userCourseID){
    let markDashboardArea = document.querySelector("#marksBody")

    let courseMarks

    let semesterCourses = await sendRequest(`/api/semesters/${userSemesterID}/courses`, "GET");

    completeMarkListHTML = ""

    try {
        for(semesterCourse of semesterCourses){
            if(semesterCourse.userCourseID == userCourseID && semesterCourse.userSemesterID == userSemesterID)
                courseMarks = semesterCourse.marks
        }
        if(courseMarks.length > 0){
            for(courseMark of courseMarks){
                console.log(courseMark)
                let status = ""
                let receivedMark = "-";
                let weightedMark = "Enter Mark for Weighted Mark";
                let percentageMark = "Enter Mark for Percentage Mark";
                let percentageMarkFormatting = "text-muted"
                if (courseMark.receivedMark != null)
                    receivedMark = courseMark.receivedMark
                if (courseMark.weightedMark != null){
                    percentageMark = parseFloat(courseMark.weightedMark)/parseFloat(courseMark.weighting) * 100
                    weightedMark = courseMark.weightedMark.toFixed(2)

                    if(percentageMark >= 50){
                        status = ` - Passed with ${weightedMark} %`
                        percentageMark = percentageMark.toFixed(2)
                        percentageMarkFormatting = "text-success"
                    } else {
                        status = ` - Failed with ${weightedMark} %`
                        percentageMark = percentageMark.toFixed(2)
                        percentageMarkFormatting = "text-danger"
                    }
                }
                completeMarkListHTML += `<div class="card w-100 mb-3">
                                            <div class="card-body text-dark">
                                                <h5 class="card-title">${courseMark.component}</h5>
                                                <h6 class="card-subtitle mb-2 text-muted">Weighting - ${parseFloat(courseMark.weighting).toFixed(2)} %<span class="${percentageMarkFormatting}">${status}</span></h6>

                                                <div class="w-100 text-center mb-2 fw-bold card-text">${courseMark.receivedMark == null ? "?" : courseMark.receivedMark} / ${courseMark.totalMark} marks</div>
                                                <div class="w-100 text-center mb-3 fw-bold card-text"><h6 class="card-subtitle ${percentageMarkFormatting}">${percentageMark} %</h6></div>


                                                <button class="btn btn-danger" type="button" data-bs-toggle="collapse" data-bs-target="#removeMark-${courseMark.markID}">Remove Mark</button>
                                                <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#updateMark-${courseMark.markID}">Update Mark</button>

                                                <div class="collapse mt-3 p-4 bg-dark text-white rounded" id="removeMark-${courseMark.markID}">
                                                    <p>Are you sure you want to remove this mark?</p>
                                                    <div class="mb-1" id="removeMarkMessage-${courseMark.markID}"></div><br>
                                                    <button type="button" onclick="removeMark(${courseMark.markID}, ${userCourseID}, ${userSemesterID})" class="btn btn-danger">Remove Mark</button>
                                                    <button class="btn btn-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#removeMark-${courseMark.markID}">Cancel</button>
                                                </div>

                                                <div class="collapse rounded" id="updateMark-${courseMark.markID}">
                                                    <form class="mt-3 p-4 bg-dark text-white rounded" onsubmit="updateMark(event, ${courseMark.markID}, ${userCourseID}, ${userSemesterID})">
                                                        <div class="form-group mb-3">
                                                            <label for="updateMark-componentName-${courseMark.markID}">Component Name</label>
                                                            <input type="text" class="mt-1 form-control" name="component" id="updateMark-componentName-${courseMark.markID}" value="${courseMark.component}" required>
                                                        </div>

                                                        <div class="row">
                                                            <div class="col form-group mb-3">
                                                                <label for="updateMark-receivedMark-${courseMark.markID}">Received Mark</label>
                                                                <input type="number" class="mt-1 form-control" name="receivedMark" id="updateMark-receivedMark-${courseMark.markID}" value="${courseMark.receivedMark}" step="any">
                                                            </div>
                                                            
                                                            <div class="col form-group mb-3">
                                                                <label for="updateMark-totalMark-${courseMark.markID}">Total Mark</label>
                                                                <input type="number" class="mt-1 form-control" name="totalMark" id="updateMark-totalMark-${courseMark.markID}" value="${courseMark.totalMark}" step="any"">
                                                            </div>
                                                        </div>

                                                        <div class="form-group mb-3">
                                                            <label class="mb-1" for="updateMark-weighting-${courseMark.markID}">Weighting</label>
                                                            <div class="input-group mb-3">
                                                                <input type="number" class="form-control" name="weighting" id="updateMark-weighting-${courseMark.markID}" value="${courseMark.weighting}" step="any">
                                                                <span class="input-group-text">%</span>
                                                            </div>
                                                        </div>

                                                        <div class="mb-1" id="updateMarkMessage-${courseMark.markID}"></div><br>
                                                        <button type="submit" class="btn btn-primary">Update Mark</button>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>`
            }
        } else {
            completeMarkListHTML = `<div class="bg-dark">
                                        <p class="amx-0 py-2 bg-dark text-center text-white border border-secondary" id="courseMarkList-noMarks">
                                            No marks for this course! Add a mark to this course before continuing.
                                        </p>
                                    </div>`
        }

    } catch(e){
        console.log(e)
        completeMarkListHTML = `<div class="bg-dark">
									<p class="amx-0 py-2 bg-dark text-center text-white border border-secondary" id="courseMarkList-noMarks">
										No marks for this course! Add a mark to this course before continuing.
									</p>
								</div>`
    }

    markDashboardArea.innerHTML = `<div class="text-white">
										<h5 class="mb-3">Coursework Components</h5>

										<div class="bg-dark" id="dashboardMarks-listing">${completeMarkListHTML}</div>

                                        <button class="btn btn-success mt-3" type="button" data-bs-toggle="collapse" data-bs-target="#marks-addMark">
                                            Add Mark
                                        </button>

                                        <div class="collapse" id="marks-addMark">
                                            <div class="border border-success mt-3 p-4 rounded">
                                                <form onsubmit="addMark(event, ${userSemesterID}, ${userCourseID})">
                                                    <div class="form-group mb-3">
                                                        <label for="addMark-componentName">Component Name</label>
                                                        <input type="text" class="mt-1 form-control" name="component" id="addMark-componentName" placeholder="eg: Coursework Exam I" required>
                                                    </div>

                                                    <div class="row">
                                                        <div class="col form-group mb-3">
                                                            <label for="addMark-receivedMark">Received Mark</label>
                                                            <input type="number" class="mt-1 form-control" name="receivedMark" id="addMark-receivedMark" placeholder="eg: 94" step="any">
                                                        </div>
                                                        
                                                        <div class="col form-group mb-3">
                                                            <label for="addMark-totalMark">Total Mark</label>
                                                            <input type="number" class="mt-1 form-control" name="totalMark" id="addMark-totalMark" placeholder="eg: 100" step="any">
                                                        </div>
                                                    </div>

                                                    <div class="form-group mb-3">
                                                        <label class="mb-1" for="addMark-weighting">Weighting</label>
                                                        <div class="input-group mb-3">
                                                            <input type="number" class="form-control" name="weighting" id="addMark-weighting" placeholder="eg: 15" step="any">
                                                            <span class="input-group-text">%</span>
                                                        </div>
                                                    </div>

                                                    <div class="mb-1" id="addMarkMessage"></div><br>
                                                    <button type="submit" class="btn btn-success">Add Mark</button>
                                                </form>
                                            </div>
                                        </div>

										<hr class="my-3">
									</div>`
}

async function addMark(event, userSemesterID, userCourseID){
    event.preventDefault()

    let form = event.target

    let markDetails = {
        "component" : form.elements["component"].value,
        "totalMark" : form.elements["totalMark"].value == "" ? null : form.elements["totalMark"].value,
        "receivedMark" : form.elements["receivedMark"].value == "" ? null : form.elements["receivedMark"].value,
        "weighting" : form.elements["weighting"].value
    }

    let result = await sendRequest(`/api/semesters/${userSemesterID}/courses/${userCourseID}/marks`, "POST", markDetails);
    let messageArea = document.querySelector(`#addMarkMessage`)

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="text-success text-center">Mark added successfully!</b>
                                </div>`
        loadMarksDashboardListing(userSemesterID, userCourseID)
    }
}

async function removeMark(markID, userCourseID, userSemesterID){
    let markDetails = {
        "markID" : markID,
    }

    console.log(markDetails)

    let result = await sendRequest(`/api/semesters/${userSemesterID}/courses/${userCourseID}/marks`, "DELETE", markDetails);
    let messageArea = document.querySelector(`#removeMarkMessage-${markID}`)

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="text-success text-center">Mark removed successfully!</b>
                                </div>`
        loadMarksDashboardListing(userSemesterID, userCourseID)
    }
}

async function updateMark(event, markID, userCourseID, userSemesterID){
    event.preventDefault();

    let form = event.target

    let updateDetails = {
        "markID" : markID,
        "component" : form.elements["component"].value,
        "totalMark" : form.elements["totalMark"].value == "" ? null : form.elements["totalMark"].value,
        "receivedMark" : form.elements["receivedMark"].value == "" ? null : form.elements["receivedMark"].value,
        "weighting" : form.elements["weighting"].value
    }

    let result = await sendRequest(`/api/semesters/${userSemesterID}/courses/${userCourseID}/marks`, "PUT", updateDetails);
    let messageArea = document.querySelector(`#updateMarkMessage-${markID}`)

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="text-success text-center">Mark updated successfully!</b>
                                </div>`
        loadMarksDashboardListing(userSemesterID, userCourseID)
    }
}

async function loadMarksDashboard(event, userSemesterID){
    event.preventDefault()
    let markDashboardArea = document.querySelector("#marksBody")

    let selectedCourseID = event.target.elements["selectedCourse"].value

    let semesterCourses = await sendRequest(`/api/semesters/${userSemesterID}/courses`, "GET");

    let courseMarks = null

    if("error" in semesterCourses || "msg" in semesterCourses){
        markDashboardArea.innerHTML = `<b class="text-danger text-center">${semesterCourses["error"]}</b>`
    } else {
        try {
            for(semesterCourse of semesterCourses)
                if(semesterCourse.userCourseID == selectedCourseID)
                    courseMarks = semesterCourse.marks
            
            if(courseMarks == null)
                markDashboardArea.innerHTML = `<b class="text-danger text-center">Course not found in your courses!</b>`
            else {
                loadMarksDashboardListing(userSemesterID, selectedCourseID)
            }

        } catch (e) {
            markDashboardArea.innerHTML = `<b class="text-danger text-center">An unexpected error has occurred!</b>`
        }
    }
}

async function enrollSemester(event){
    event.preventDefault()

    let form = event.target;

    let semesterDetails = {
        "semesterTerm" : form.elements["semesterName"].value,
        "semesterYear" : form.elements["semesterYearStart"].value
    }


    let result = await sendRequest("/api/semesters", "POST", semesterDetails);
    let messageArea = document.querySelector("#enrollSemesterMessage")

    if("error" in result || "msg" in result){
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
        let termChunks = chunks[1].split(" ");

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

    if("error" in result || "msg" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<div class="align-middle">
                                    <div class="spinner-border text-success" role="status"></div>
                                    <b class="text-success text-center">Successfully unenrolled from semester!</b>
                                </div>`
        setTimeout(mySemestersDashboard, 3000);
    }
}

async function updateGPA(semesterCourses, userSemesterID){
    let user = await identifyUser();
    console.log(user)
    
    let GPAArea = document.querySelector(`#semester-${userSemesterID}-GPA`)
    let gradeLetterArea = document.querySelector(`#semester-${userSemesterID}-gradeArea`)

    if("error" in user){
        console.log(user["error"])
        GPAArea.innerHTML = `-`
        return;
    } else {
        //CALCULATE COURSE GPA using semesterCourses, accomodate empty marks.
        let courseFinalMark = 0
        let courseFinalLetterGrade = "-"
        let weightedQualityPoints = 0
        let totalCreditHours = 0
        let finalGPA = "-"
        let gradeAreaHTML = ""
        
        try {
            for(semesterCourse of semesterCourses){
                let modifier = 0
                courseFinalMark = await calculateCourseMark(semesterCourse.marks)
                courseFinalLetterGrade = calculateLetterGrade(courseFinalMark)
                let qualityPoints = calculateQualityPoints(courseFinalLetterGrade)
                if(semesterCourse.towardsSemesterGPA){
                    totalCreditHours += semesterCourse.credits
                    modifier = 1
                    gradeAreaHTML += `<div class="col text-center mb-0">
                                        <h2 class="${(courseFinalMark >= 50) ? "text-success": "text-danger"} fw-bold fs-1 mb-0">${courseFinalLetterGrade}</h2>
                                  </div>`
                }
                weightedQualityPoints += qualityPoints * semesterCourse.credits * modifier
            }
            gradeLetterArea.innerHTML = gradeAreaHTML;

            finalGPA = parseFloat(weightedQualityPoints)/parseFloat(totalCreditHours)
        } catch(e){
            finalGPA = "-"
        }

        //console.log(semesterCourses)
        GPAArea.innerHTML = `${finalGPA.toFixed(2)}`
        //Calculate GPA based on ranges of marks
    }
}

async function calculateCourseMark(courseMarks){
    console.log(courseMarks)
    let totalMark = 0
    try {
        for(courseMark of courseMarks){
            if(courseMark.receivedMark != null && courseMark.totalMark != null){
                console.log(courseMark.receivedMark/courseMark.totalMark * courseMark.weighting)
                totalMark += (parseFloat(courseMark.receivedMark) / parseFloat(courseMark.totalMark)).toFixed(2) * parseFloat(courseMark.weighting).toFixed(2)
            }
        }
        console.log(totalMark)
        return Math.ceil(totalMark.toFixed(2))
    } catch(e) {
        console.log(e)
        return null;
    }

    return null;
}

function calculateQualityPoints(letterGrade){
    console.log(letterGrade)
    if(letterGrade == "A+")
        return 4.3
    else if(letterGrade == "A")
        return 4.0
    else if(letterGrade == "A-")
        return 3.7
    else if(letterGrade == "B+")
        return 3.3
    else if(letterGrade == "B")
        return 3.0
    else if(letterGrade == "B-")
        return 2.7
    else if(letterGrade == "C+")
        return 2.3
    else if(letterGrade == "C")
        return 2.0
    else if(letterGrade == "F1")
        return 1.7
    else if(letterGrade == "F2")
        return 1.3
    else
        return 0.0
}

function calculateLetterGrade(coursemark){
    if(coursemark >= 90)
        return "A+"
    else if(coursemark >= 80)
        return "A"
    else if(coursemark >= 75)
        return "A-"
    else if(coursemark >= 70)
        return "B+"
    else if(coursemark >= 65)
        return "B"
    else if(coursemark >= 60)
        return "B-"
    else if(coursemark >= 55)
        return "C+"
    else if(coursemark >= 50)
        return "C"
    else if(coursemark >= 45)
        return "F1"
    else if(coursemark >= 40)
        return "F2"
    else if(coursemark >= 0)
        return "F3"
}

async function loadSemesterGradeDetails(userSemesterID){
    let semesterTab = document.querySelector(`#grades-semester-${userSemesterID}`)
    let semesterCourses = await sendRequest(`/api/semesters/${userSemesterID}/courses`, "GET");

    let completeCourseListAccordion = ""
    try {

        if("error" in semesterCourses || "msg" in semesterCourses){
            semesterTab.innerHTML = `<div class="text-center text-white">
                                        <h2>Unable to load semester grades!</h2>
                                        <p>${semesterCourses["error"]}</p>
                                    </div>`
            return;
        }

        semesterCourses = semesterCourses.sort((a, b) => (a.courseCode > b.courseCode ? 1 : -1))

        for(semesterCourse of semesterCourses){
            courseMarks = semesterCourse.marks

            let gradeExpandedBody = "";
            let formattedGradeBody = "";
            let calculatedCourseMarkParsed = "-"
            let letterGrade = "-"

            if(courseMarks.length > 0){
                let calculatedCourseMark = await calculateCourseMark(courseMarks);
                for(courseMark of courseMarks){
                    let receivedMark = "-";
                    let weightedMark = "-";
                    let percentageMark = "-";
                    let weighting = "-"
                    let totalMark = "-";
                    let tableRowFormatting = "text-muted"
                    
                    

                    if(calculatedCourseMark != null){
                        calculatedCourseMarkParsed = parseFloat(calculatedCourseMark).toFixed(0)
                        letterGrade = calculateLetterGrade(calculatedCourseMarkParsed)
                    }

                    console.log(letterGrade)

                    if (courseMark.weighting != null)
                        weighting = courseMark.weighting;

                    if (courseMark.receivedMark != null)
                        receivedMark = courseMark.receivedMark
                    
                    if (courseMark.totalMark != null)
                        totalMark = courseMark.totalMark

                    if (courseMark.weightedMark != null && courseMark.weighting != null && parseFloat(courseMark.weighting) != 0){
                        percentageMark = parseFloat(courseMark.weightedMark)/parseFloat(courseMark.weighting) * 100
                        weightedMark = courseMark.weightedMark.toFixed(2)
        
                        if(percentageMark >= 50){
                            percentageMark = percentageMark.toFixed(2)
                            tableRowFormatting = "text-success"
                        } else {
                            percentageMark = percentageMark.toFixed(2)
                            tableRowFormatting = "text-danger"
                        }
                    }

                    gradeExpandedBody += `<tr>
                                                <th scope="row"><span class="${tableRowFormatting}">${courseMark.component}</span></th>
                                                <td><span class="${tableRowFormatting}">${receivedMark}</span></td>
                                                <td><span class="${tableRowFormatting}">${totalMark}</span></td>
                                                <td><span class="${tableRowFormatting}">${(percentageMark == '-') ? percentageMark: percentageMark + " %"}</span></td>
                                                <td><span class="${tableRowFormatting}">${(weightedMark == '-') ? weightedMark: weightedMark + " %"} / ${weighting} %</span></td>
                                            </tr>`

                    
                }

                formattedGradeBody = `<div class="table-responsive">
                                        <table class="w-100 table table-hover table-sm table-dark text-center">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Component</th>
                                                    <th scope="col">Mark</th>
                                                    <th scope="col">Total</th>
                                                    <th scope="col">%</th>
                                                    <th scope="col">W %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${gradeExpandedBody}
                                            </tbody>
                                            <tfoot>
                                                <tr class="border-white border-bottom">
                                                    <th scope="row">Total</th>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <th scope="row">${calculatedCourseMarkParsed} %</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    <div class="text-center">
                                        <h2 class="${(calculatedCourseMarkParsed >= 50) ? "text-success": "text-danger"} fw-bold fs-1 mb-3">${letterGrade}</h2>
                                        <hr class="my-2 text-white border-bottom border-white" style="opacity : 1">
                                    </div>`
            } else {
                formattedGradeBody = `<div class="bg-dark mb-0">
                                        <p class="mx-0 py-2 bg-dark text-center text-white border border-secondary" id="courseMarkList-noMarks">
                                            No marks for this course! Add a mark to this course before continuing.
                                        </p>
                                    </div>`
            }

            


            completeCourseListAccordion += `<div class="accordion-item bg-dark">
                                                <h2 class="accordion-header" id="grades-courseList-${semesterCourse.userCourseID}-header">
                                                    <button class="accordion-button font-monospace text-dark collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#grades-courseList-${semesterCourse.userCourseID}">
                                                        ${semesterCourse.courseCode} - ${semesterCourse.courseName}
                                                    </button>
                                                </h2>

                                                <div id="grades-courseList-${semesterCourse.userCourseID}" class="accordion-collapse collapse" data-bs-parent="#grades-courses">
                                                    <div id="gradeDetails-${semesterCourse.userCourseID}" class="accordion-body collapsed bg-dark text-white border-end border-bottom border-start border-secondary">
                                                        ${formattedGradeBody}
                                                    </div>
                                                </div>
                                            </div>`
            
        }

        semesterTab.innerHTML = `<div class="jumbotron bg-dark border border-secondary rounded py-5 mb-3">
                                    <h1 class="display-4 text-center fw-bold"><span id="semester-${userSemesterID}-GPA"></span> GPA</h1>
                                    <div class="row mt-4" id="semester-${userSemesterID}-gradeArea"></div>
                                </div>
                                
                                <div class="accordion bg-dark" id="grades-courses">${completeCourseListAccordion}</div>`

        updateGPA(semesterCourses, userSemesterID);

    } catch(e) {
        console.log(e)
        semesterTab.innerHTML = `<div class="text-center text-white">
                                    <h2>Unable to load semester!</h2>
                                    <p>An error has occured that prevents the loading of the semester.<br></p>
                                </div>`
    }
}


async function gradeHandler(){
    let user = await identifyUser();
    let courseGradeArea = document.querySelector("#gradeContent")

    if("error" in user){
        courseGradeArea.innerHTML = `<div class="text-center text-white">
                                        <h2>User is not logged in!</h2>
                                        <p>${user["error"]}</p>
                                    </div>`
    } else {
        let semesterList = await sendRequest(`/api/semesters`, "GET");

        if("error" in semesterList){
            courseGradeArea.innerHTML = `<div class="text-center text-white">
                                            <h2>User is not enrolled in any semesters!</h2>
                                            <p>${user["error"]}</p>
                                        </div>`
        } else {
            let gradeSemesterMenuButtons = "";
            let gradeSemesterTabs = "";

            semesterList = semesterList.sort((a, b) => {
                if (a.semesterYear < b.semesterYear)
                    return 1;
    
                if(a.semesterYear == b.semesterYear){
                    if (a.semesterTerm < b.semesterTerm)
                        return 1;
                    else
                        return -1;
                }
                    
                if (a.semesterYear > b.semesterYear)
                    return -1;
            })

            for(semester of semesterList){
                gradeSemesterMenuButtons += `<button class="nav-link border-bottom border-primary rounded-0" onclick="loadSemesterGradeDetails(${semester.userSemesterID})" id="grades-semester-${semester.userSemesterID}-tab" data-bs-toggle="pill" data-bs-target="#grades-semester-${semester.userSemesterID}" type="button" role="tab">${semester.semesterYear}, ${semester.semesterTerm}</button>`
                gradeSemesterTabs += `<div class="tab-pane fade ps-3" id="grades-semester-${semester.userSemesterID}" role="tabpanel"></div>`
            }
            courseGradeArea.innerHTML = `<div class="d-flex align-items-start row">
                                            
                                            <div class="nav flex-column nav-pills col-md-3 mb-3 border border-primary border-bottom-0 rounded p-0" id="v-pills-gradeTab" role="tablist">
                                                ${gradeSemesterMenuButtons}
                                            </div>

                                            <div class="tab-content col-md-9 ps-3" id="v-pills-gradeTabContent">
                                                <div class="tab-pane fade show active" id="defaultGradePage" role="tabpanel">
                                                    <div class="text-center text-white">
                                                        <h2>Please select a semester!</h2>
                                                        <p>Please select a semester to view the course and mark details for that semester.</p>
                                                    </div>
                                                </div>
                                                
                                                ${gradeSemesterTabs}
                                            </div>
                                        </div>`
        }
    }
}

function main(){
    identifyUserContext()
}


window.addEventListener('DOMContentLoaded', main);
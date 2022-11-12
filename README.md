# summary
 This is a CCTV making project with Raspberry Pi created in 2022 web programming.

***

# why the project started
 * Lesson 403 is taught by an anonymous teacher.
 * It seems that the students are using their laptops to do something else, but there is no mirror in the back of the classroom to check.
 * Therefore, in 403 and 403, we want to make a cctv that can be accessed as a web page using Raspberry Pi.

***

# needed features
 * camera management
    1. No one can connect in web page. (Teacher only.)
    2. In case of simultaneous connection, the previously connected connection is disconnected.
    3. Received input ID and password.
 * ID and password management
    1. The administrator ID and password consist of the following information.   
    => Specific ID, pw with HASH encryption
    2. If you forget your password, an email is sent to admin@gsa.hs.kr and you can reset your password when authentication is complete.
 * video management
    1. The cctv can adjust the angle using the pan-tilt-hat (https://www.npmjs.com/package/pan-tilt-hat) module.   (https://github.com/RogerHardiman/node-pan-tilt-driver)
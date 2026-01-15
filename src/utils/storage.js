export const fetchUserData = () => {
    return JSON.parse(localStorage.getItem('userData'));
};

export const saveUserData = (data) => {
    localStorage.setItem('userData', JSON.stringify(data));
};
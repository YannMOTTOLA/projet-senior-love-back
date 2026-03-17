// Vérifier si le mot de passe est suffisamment complexe
export function isComplexPassword(password) {
    // Mot de passe est complexe si : 
    // - Minimum 8 caractères (CNIL recommande 12)
    if (password.length < 8) {
        return false;
    }
    // - 1 majuscule
    if (!/[A-Z]/.test(password)) {
        return false;
    }
    // - 1 minuscule
    if (!/[a-z]/.test(password)) {
        return false;
    }
    // - 1 chiffre
    if (!/[0-9]/.test(password)) {
        return false;
    }
    // - 1 caractère spécial
    // Regex = un caractère qui n'EST PAS un de ceux la = ^
    if (!/[^a-zA-Z0-9]/.test(password)) {
        return false;
    }
    return true;
}
// fonction pour créer un id de 6 charactères afin de l'attacher à l'user en front
export function getShortId(uuid) {
    return uuid.replace(/-/g, "").slice(-6);
}

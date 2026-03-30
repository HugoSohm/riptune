fn main() {
    // Charge le .env à la racine s'il existe (pour le dev local)
    let _ = dotenvy::dotenv();
    
    // Si la variable est présente (du .env ou de GitHub Secrets), on la passe au compilateur
    if let Ok(key) = std::env::var("RESEND_API_KEY") {
        println!("cargo:rustc-env=RESEND_API_KEY={}", key);
    }

    tauri_build::build()
}

fn main() {
    // Load .env from project root if it exists (for local development)
    let _ = dotenvy::dotenv();

    // If the variable is present (from .env or GitHub secrets), pass it to the compiler
    if let Ok(key) = std::env::var("RESEND_API_KEY") {
        println!("cargo:rustc-env=RESEND_API_KEY={}", key);
    }

    if let Ok(key) = std::env::var("APTABASE_API_KEY") {
        println!("cargo:rustc-env=APTABASE_API_KEY={}", key);
    }

    tauri_build::build()
}

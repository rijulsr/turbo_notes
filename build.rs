use std::env;

fn main() {
    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap();
    
    match target_os.as_str() {
        "windows" => {
            println!("cargo:rustc-link-lib=user32");
            println!("cargo:rustc-link-lib=shell32");
        }
        "macos" => {
            println!("cargo:rustc-link-lib=framework=Cocoa");
            println!("cargo:rustc-link-lib=framework=Foundation");
        }
        "linux" => {
            // No special linking required for Linux
        }
        _ => {
            println!("cargo:warning=Unsupported target OS: {}", target_os);
        }
    }
}

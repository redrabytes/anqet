# Anqet

## Botnet C2/CNC Detection (Beta)

This project, currently in beta version, aims to detect and expose the command and control servers of botnets in order to take further action, such as blocking or shutting them down.

---

## Introduction

Botnets represent a significant threat to cybersecurity, as they orchestrate a variety of malicious activities such as DDoS attacks, spam distribution, and data theft. Identifying and neutralizing their command and control (C&C) servers is crucial to mitigating their impact. The project uses (will use) various techniques to detect and expose these servers for proactive security measures.

---

## Features

- **Integration with URLhaus:** Integrates with URLhaus to fetch a list of potentially malicious URLs and scan them for C&C servers.
- **Port scanning:** Checking all ports on the results you got according tags set in `.env` file.
- **Logging:** Logs scan results for analysis and action.
- **Customizable:** Easily customizable through environment variables to specify tags and ignore certain types of URLs.

---

## Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com/redrabytes/anqet
    cd anqet
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

    And you need to install  [RustScan](https://github.com/RustScan/RustScan/wiki/Installation-Guide)

3. **Set up environment variables:**
   
    Create a `.env` file in the root directory and define the following variables:
   
    ```
    URLHAUS_TAGS=mirai,elf
    URLHAUS_IGNORE_TAGS=Mozi
    ```

4. **Run the script:**

    ```bash
    node index.js
    ```

---

## Usage

Ensure that the required environment variables are properly configured before running the script.

---

## Beta Testing

This version is in beta testing. Your feedback is valuable for improving the project's performance and reliability. If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request.

---

## Next Features
- 🚧 Automatic detection of potential C2 ports
- 🚧 Fetching data from other sources
- 🚧 Automatic report generation (support: threatfox, ...)
- 🚧 Malware type detection (mirai, qakbot, cobaltstrike, etc...)
- 🚧 Exploit to buffer overflowing a mirai botnet

---

## Credits
[redra.](https://twitter.com/redrabytes/) | [abuse.ch](https://twitter.com/abuse_ch)

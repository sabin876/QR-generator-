# Instant QR Code Generator (Static & Permanent)

> **Zero Backend • Zero Dependencies • 100% Client-Side & Private**  
> Just provide any link or text to generate, customize, preview, and download crisp QR codes immediately.

---

## Why Static QR Codes?

- **Permanent Lifetime:** The URL is directly hard-encoded into the black and white pixel patterns. Once downloaded or printed, it works **forever** without depending on any server, database, or subscription.
- **Zero Running Costs:** No hosting bills, no monthly SaaS subscriptions, and no database to maintain.
- **100% Private & Offline:** Everything generates inside your browser. No data is sent across the internet.

---

## How to Use

1. Double-click **[`index.html`](file:///c:/Users/DELL/OneDrive/Desktop/QR/index.html)** in this folder to open it in Chrome, Edge, Safari, or Firefox.
2. Enter or paste any website link in the input box.
3. Your QR code is generated **live on screen instantly**!
4. Click **Download PNG (Black & White)** to save a print-ready image with a solid white background and black QR code.

---

## Features

- **Instant Live Generation:** Real-time QR preview as you type or paste links.
- **Print-Ready Downloads:** Defaults to solid pure white background (`#ffffff`) and deep black modules (`#000000`) for 100% scanner and printer compatibility.
- **Vector SVG Export:** Lossless vector format for scalable posters, billboards, and packaging.
- **1-Click Copy Image:** Copy directly to your clipboard to paste into Word, Photoshop, or Slack.
- **Shape & Style Controls:** Choose between classic square modules, rounded corners, or circular dots.
- **Optional Center Logo:** Upload your own brand icon or image to place in the center of the QR code.
- **Recent History:** Automatically saves recently generated links to your browser's local storage for easy 1-click reloading.
- **Dark & Light Mode:** Sleek glassmorphic interface with theme toggle.

---

## Project Structure

```
QR/
├── index.html            # Main application (double-click to run)
├── style.css             # Glassmorphism & responsive styles
├── app.js                # Core QR generation & export logic
├── lib/
│   └── qr-code-styling.js # Bundled offline vector QR library
└── README.md             # Documentation
```

# Product Requirements Document (PRD)

## Project Title: Link to QR (QR Toolkit)
**Domain:** `https://linktoqr.in`  
**Version:** 1.0.0  
**Target Audience:** Businesses, Marketers, Developers, Event Organizers, and General Users looking for free, high-resolution, branded QR codes.

---

## 1. Executive Summary & Value Proposition
**Link to QR** is an all-in-one, enterprise-grade QR code generator and management platform. It allows users to convert web links, Wi-Fi credentials, digital business cards (vCard), plain text, SMS, phone numbers, events, app store links, and PDF files into customized QR codes with logos, custom frame styles, eye shapes, dot patterns, and gradient colorways.

### Key Differentiators:
- **100% Free & Unlimited Static QR Code Generation** without mandatory sign-up.
- **High-Resolution Vector Export:** Crisp PNG downloads up to 1024px+ and scalable vector outputs.
- **Custom Branding:** Center logo badge overlay with shape cropping (round, square, shield) and aspect-ratio preservation.
- **Dynamic QR Code Engine:** Firebase Firestore backed dynamic QR management for real-time URL redirection and analytics.
- **Offline & Instant Loading:** Built-in Service Worker (`sw.js`) and client-side LocalStorage cache engine for offline capability and draft recovery.
- **Complete Privacy & Local Processing:** Static QR rendering happens entirely in the user's browser canvas.

---

## 2. Target Persona & User Journeys

### Persona 1: Restaurant / Café Owner
- **Goal:** Share digital menus or Wi-Fi passwords easily without printing new posters repeatedly.
- **Flow:** Selects **PDF** or **Wi-Fi** tab -> Inputs details -> Customizes brand colors & adds restaurant logo -> Downloads high-res printable PNG/SVG.

### Persona 2: Corporate Marketing Professional
- **Goal:** Create dynamic QR codes for print flyers, billboards, or business cards with trackable landing pages.
- **Flow:** Logs in via Firebase Auth -> Creates a **Dynamic QR** -> Monitors scans -> Updates target URL in real-time without re-printing.

### Persona 3: Event Organizer
- **Goal:** Send calendar invite QR codes on ticket confirmations.
- **Flow:** Selects **Event** tab -> Fills event details & start/end times -> Downloads QR code and embeds in event email templates.

---

## 3. Detailed Functional Requirements

### 3.1 QR Code Content Types (10 Modes)
1. **URL / Link:** Web address conversion with auto-protocol verification.
2. **Plain Text:** Multiline text snippets, wifi passwords, notes, or keys.
3. **Wi-Fi Network:** SSID, Password, Encryption selection (WPA/WPA2/WEP/None), Hidden SSID flag.
4. **vCard (Digital Business Card):** First Name, Last Name, Org, Title, Mobile, Email, Website, Address.
5. **Email:** Recipient address, pre-filled subject line, and body message.
6. **Phone Number:** One-click dialer shortcut (`tel:`).
7. **SMS Message:** Phone number and pre-filled text payload.
8. **Event / Calendar:** Title, Location, Start/End Datetime, Description.
9. **App Store Router:** iOS App Store URL and Android Google Play Store fallback routing.
10. **PDF Document:** Document title and download/view link attachment.

### 3.2 Visual Customization Engine
- **Dot Styles:** Square, Rounded, Smooth Dots, Classy Diamonds.
- **Eye Patterns (Finder Patterns):** Standard Square, Rounded Corners, Circular Rings.
- **Foreground Styles:** Solid Hex Color, Linear 2-Color Gradient.
- **Background Styles:** Solid Color, Transparent Canvas (`#00000000`).
- **Frames:** Custom outer frame styles (e.g., "SCAN ME", "DISCOVER", "CONNECT") with adjustable frame color.
- **Logo Integration:** Upload custom PNG/JPG/SVG or paste URL. Automatic Google Drive URL auto-converter.
- **Error Correction Levels:** L (7%), M (15%), Q (25%), H (30%) error recovery options.

### 3.3 Dynamic QR & Analytics (Firebase Integrated)
- User registration and Google/Email authentication.
- Saved QR Code management dashboard.
- Real-time URL redirection update without re-generating printed QR graphics.
- Scan frequency logging and user history.

### 3.4 Built-In Utilities & Modals
- **QR Code Scanner:** Live webcam scanner and image file upload decoder.
- **Draft Form Auto-Save:** Automatically caches user's current configuration locally so form input is never lost on refresh.
- **Recent Download History:** Local cache of up to 20 recently generated QR codes.
- **SEO & Social Share Preview:** Dynamic page titles, OpenGraph meta tags, and schema.org WebApplication structured data.

---

## 4. Non-Functional Requirements (NFRs)
- **Performance:** Sub-100ms client-side canvas render time. Page load speed score > 90 on Google PageSpeed Insights.
- **Offline Support:** Progressive Web App (PWA) ready via `sw.js` Service Worker and Stale-While-Revalidate caching.
- **Security:** Strict CORS handling, Google Drive auto-proxy fallback, secure Firebase Auth rules.
- **Usability & Design:** Mobile-responsive design with Tailwind CSS, supporting dark/light UI contrast standards (WCAG AA).

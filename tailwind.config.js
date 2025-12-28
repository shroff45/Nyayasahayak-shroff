/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Fraunces', 'ui-serif', 'Georgia'],
                mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
                dev: ['Noto Sans Devanagari', 'Inter', 'system-ui', 'sans-serif'],
                guj: ['Noto Sans Gujarati', 'Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                ns: {
                    bg0: "#070A12",
                    bg1: "#0A1024",
                    surface: "rgba(255,255,255,.06)",
                    stroke: "rgba(255,255,255,.12)",
                    primary: { 900: "#071CFF", 700: "#2B5CFF", 500: "#4AA3FF" },
                    secondary: { 700: "#9A4DFF", 500: "#C06CFF" },
                    accent: { 500: "#2BE7B8", 400: "#62F5D3" },
                    neutral: {
                        0: "#FFFFFF", 50: "#F4F7FF", 100: "#E9EEFF", 200: "#D0DAFF",
                        300: "#A9B7E8", 400: "#7C8AC2", 500: "#5B6794", 600: "#3F4766",
                        700: "#2A3047", 800: "#171B2A", 900: "#0B0E18"
                    },
                    success: "#1FD17C", info: "#2AA8FF", warning: "#FFB020", danger: "#FF3D5A"
                }
            },
            borderRadius: { xl: "22px", lg: "16px", md: "12px" },
            boxShadow: {
                md: "0 12px 30px rgba(0,0,0,.38)",
                lg: "0 18px 50px rgba(0,0,0,.45)",
                xl: "0 24px 80px rgba(0,0,0,.55)"
            }
        },
    },
    plugins: [],
}

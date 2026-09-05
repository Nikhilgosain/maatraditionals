/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        animation: {
            spin: 'spin 1s linear infinite',
          },
        zIndex: {
            9999: '9999'
        }
      },
    },
    plugins: [],
  }
  
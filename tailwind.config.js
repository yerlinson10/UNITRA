import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            colors: {
                unitra: {
                    ink: '#111315',
                    lime: '#B8E34B',
                    bg: '#F5F6F3',
                    surface: '#FFFFFF',
                    border: '#E3E5E0',
                    muted: '#6B7069',
                    text: '#252925',
                    available: '#22A06B',
                    pending: '#D97706',
                    error: '#DC4444',
                },
            },
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                display: ['"Barlow Condensed"', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};

'use client'
import { Roboto } from 'next/font/google'
import { createTheme } from '@mui/material/styles'

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap'
})

const theme = createTheme({
    palette: {
        mode: 'dark',
        // primary: {
        //     main: '#465168',
        // },
        // secondary: {
        //     main: '#D5EED7',
        // },
        // background: {
        //     default: '#e1e8ef',
        // },
    },
    typography: {
        fontFamily: roboto.style.fontFamily
    },
    components: {
        MuiAlert: {
            styleOverrides: {
                root: ({ ownerState }) => ({
                    ...(ownerState.severity === 'info' && {
                        backgroundColor: '#60a5fa'
                    })
                })
            }
        }
    }
});

export default theme

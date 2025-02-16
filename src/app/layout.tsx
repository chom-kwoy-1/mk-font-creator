import type { Metadata } from "next";
import {AppBar, CssBaseline, Toolbar, Typography} from "@mui/material";
import { ThemeProvider } from '@mui/material';
import {Box, Container} from "@mui/system";
import theme from '@/app/theme';

export const metadata: Metadata = {
    title: "MK Font Creator",
    description: "Create your own font with MK Font Creator",
};

export default function RootLayout(
    {children,}: Readonly<{ children: React.ReactNode; }>
) {
    return (
        <html lang="en">
        <body>
        <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6">
                        MKFC
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    mt: ['48px', '56px', '64px'],
                    p: 3
                }}
            >
                <Container maxWidth="lg" sx={{ mb: 4, px: { xs: 0.2, sm: 2 } }}>
                    {children}
                </Container>
            </Box>
        </ThemeProvider>
        </body>
        </html>
    );
}

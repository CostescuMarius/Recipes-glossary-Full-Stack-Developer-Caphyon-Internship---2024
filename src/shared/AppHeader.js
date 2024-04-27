import * as React from 'react';
import { AppBar, Typography, Toolbar, Grid } from "@mui/material";

/**
 * Header component displaying the application's title.

 * @returns {JSX.Element} The JSX representation of the Header component.
 */
function AppHeader() {
    return (
        /* App Bar for Header */
        <AppBar position="static" style={{ backgroundColor: '#ffb74d' }}>
            <Toolbar>
                {/* Title */}
                <Grid container justifyContent='flex-end'>
                    <Grid item>
                        <Typography
                            variant="h6"
                            align='center'
                            style={{ color: 'black', letterSpacing: '7px' }}>
                            <strong>RECIPES GLOSSARY</strong>
                        </Typography>
                    </Grid>
                </Grid>
            </Toolbar>

        </AppBar>
    );
}
export default AppHeader;

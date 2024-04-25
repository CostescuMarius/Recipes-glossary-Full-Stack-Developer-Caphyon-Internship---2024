import * as React from 'react';
import { AppBar, Typography, Toolbar, Grid } from "@mui/material";

/**
 * Header component displaying the application's title.

 * @returns {JSX.Element} The JSX representation of the Header component.
 */
function AppHeader() {
    return (
        /* App Bar for Header */
        <AppBar position="static" style={{ backgroundColor: '#F0F0F0' }}>
            <Toolbar>
                {/* Title */}
                <Grid item>
                        <Typography
                            variant="h6"
                            align='center'
                            style={{ color: 'black' }}>
                            RECIPES GLOSSARY
                        </Typography>
                    </Grid>
            </Toolbar>

        </AppBar>
    );
}
export default AppHeader;

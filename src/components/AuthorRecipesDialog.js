import React, { useContext, useState, useEffect } from "react";

import {
    Grid, Dialog, DialogContent, LinearProgress,
    List, ListItem, ListItemIcon, ListItemText, DialogTitle
} from "@mui/material";

import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import RecipesContext from "../context/RecipesContext";


/**
 * React component for displaying a dialog with recipes published by a specific author.
 * 
 * @param {object} props - The props object containing the following properties:
 * @param {boolean} props.openAuthorRecipesPopUp - Indicates whether the dialog is open or closed.
 * @param {function} props.handleCloseAuthorPopUp - Function to handle closing the dialog.
 * @param {string} props.selectedAuthor - The name of the selected author.
 * @returns {JSX.Element} The JSX representation of the AuthorRecipesDialog component.
 */
function AuthorRecipesDialog({ openAuthorRecipesPopUp, handleCloseAuthorPopUp, selectedAuthor }) {
    // Access Neo4j driver from context
    const { driver } = useContext(RecipesContext);

    // State variables for author recipes and loading status
    const [authorRecipes, setAuthorRecipes] = useState();
    const [areAuthorRecipesLoading, setAreAuthorRecipesLoading] = useState();

    /**
     * Function to get recipes published by the selected author from the Neo4j database.
     */
    const getAuthorRecipes = async () => {
        setAreAuthorRecipesLoading(true);

        const { records } = await driver.executeQuery(
            "MATCH (a:Author {name: $authorName})-[:WROTE]->(r:Recipe) " +
            "RETURN COLLECT(r.name) as recipesAuthorList ", { authorName: selectedAuthor }
        )

        setAuthorRecipes({
            recipesAuthorList: records[0].get('recipesAuthorList')
        })

        setAreAuthorRecipesLoading(false);
    }

    // Fetch author recipes when selected author changes
    useEffect(() => {
        if (selectedAuthor) {
            getAuthorRecipes();
        }
    }, [selectedAuthor]);

    return (
        // Dialog for displaying author recipes
        <Grid item>
            {areAuthorRecipesLoading == null || areAuthorRecipesLoading === true ?
                // Display loading indicator if data is loading
                (<Dialog open={openAuthorRecipesPopUp} onClose={handleCloseAuthorPopUp} fullWidth>
                    <DialogContent>
                        <LinearProgress />
                    </DialogContent>
                </Dialog>)
                :
                // Display author recipes
                (<Dialog open={openAuthorRecipesPopUp} onClose={handleCloseAuthorPopUp}>
                    <DialogTitle>Published recipes by <b>{selectedAuthor}</b></DialogTitle>

                    <DialogContent>
                        <List>
                            {authorRecipes.recipesAuthorList.map((recipe, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>
                                        <FiberManualRecordIcon fontSize="10px" />
                                    </ListItemIcon>

                                    <ListItemText primary={recipe} />
                                </ListItem>
                            ))}
                        </List>

                    </DialogContent>
                </Dialog>)}
        </Grid>
    );
}

export default AuthorRecipesDialog;
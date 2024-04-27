import React, {useState, useContext, useEffect} from "react";

import StarRate from '@mui/icons-material/StarRate';

import { Grid, Dialog, DialogContent, DialogTitle,
    DialogContentText, LinearProgress, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Typography  } from "@mui/material";

import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import RecipesContext from "../context/RecipesContext";

/**
 * React component for displaying a dialog with detailed information about a recipe.
 * 
 * @param {object} props - The props object containing the following properties:
 * @param {boolean} props.openRecipePopUp - Indicates whether the dialog is open or closed.
 * @param {function} props.handleClosePopUp - Function to handle closing the dialog.
 * @param {object} props.selectedRecipe - The selected recipe object containing recipe details.
 * @returns {JSX.Element} The JSX representation of the RecipeDetailsDialog component.
 */
function RecipeDetailsDialog({openRecipePopUp, handleClosePopUp, selectedRecipe}) {
    // Access Neo4j driver from context
    const { driver, recipes } = useContext(RecipesContext);

    // State variables for recipe details and loading status
    const [recipeDetails, setRecipeDetails] = useState();
    const [areRecipeDetailsLoading, setAreRecipeDetailsLoading] = useState();

    /**
     * Function to get detailed information about the selected recipe from the Neo4j database.
     */
    const getDetailedRecipe = async () => {
        setAreRecipeDetailsLoading(true);

        const { records } = await driver.executeQuery(
            "MATCH (r:Recipe {name: $recipeName}) " +
            "OPTIONAL MATCH (r)-[:COLLECTION]->(c:Collection) " +
            "OPTIONAL MATCH (r)-[:KEYWORD]->(k:Keyword) " +
            "OPTIONAL MATCH (r)-[:DIET_TYPE]->(d:DietType) " +
            "RETURN r.description as recipeDescription, " +
            "r.preparationTime as recipePreparationTime, " +
            "r.cookingTime as recipeCookingTime, " +
            "collect(DISTINCT c.name) as collectionList, " +
            "collect(DISTINCT k.name) as keywords, " +
            "collect(DISTINCT d.name) as dietTypes", { recipeName: selectedRecipe.recipeName }
        )

        /**
        * Compute similarity between selected recipe and other recipes, sort similar recipes and select 5 most similiar
        * from 1 to 6 because the selected recipe will be placed at first index due to similarity score of 100%
        */
        const similarRecipes = recipes.map(otherRecipe => ({
            recipeName: otherRecipe.recipeName,
            recipeDescription: otherRecipe.recipeDescription,
            similarity: computeSimilarity(selectedRecipe, otherRecipe)
        }));

        similarRecipes.sort((a, b) => b.similarity - a.similarity);

        setRecipeDetails(
            {
                recipeDescription: records[0].get('recipeDescription'),
                recipePreparationTime: Number(records[0].get('recipePreparationTime').low),
                recipeCookingTime: Number(records[0].get('recipeCookingTime').low),
                collectionList: records[0].get('collectionList'),
                keywords: records[0].get('keywords'),
                dietTypes: records[0].get('dietTypes'),
                similarRecipes: similarRecipes.slice(1, 6)
            }
        )

        setAreRecipeDetailsLoading(false);
    }

    /**
     * Function to compute the similarity factor between two recipes based on their ingredients.
     * 
     * @param {object} recipe1 - The first recipe object.
     * @param {object} recipe2 - The second recipe object.
     * @returns {number} The similarity factor between the two recipes.
     */
    function computeSimilarity(recipe1, recipe2) {
        const commonElements = recipe1.ingredientsList.filter(ingredient => recipe2.ingredientsList.includes(ingredient));

        if (commonElements.length === 0) {
            return 0;
        }

        const similarity = commonElements.length / (recipe1.ingredientsList.length + recipe2.ingredientsList.length - commonElements.length);
        return similarity;
    }

    // Fetch detailed recipe information when selected recipe changes
    useEffect(() => {
        if(selectedRecipe) {
            getDetailedRecipe();
        }
    }, [selectedRecipe]);

    return (
        // Dialog for displaying recipe details
        <Grid item>
            {areRecipeDetailsLoading == null || areRecipeDetailsLoading === true ?
                // Display loading indicator if data is loading
                (<Dialog open={openRecipePopUp} onClose={handleClosePopUp} fullWidth>
                    <DialogContent>
                        <LinearProgress />
                    </DialogContent>
                </Dialog>)
                :
                // Display recipe details
                (<Dialog open={openRecipePopUp} onClose={handleClosePopUp} scroll="paper">
                    <DialogTitle>{selectedRecipe.recipeName}</DialogTitle>
                    <DialogContent>
                        <Grid container gap="20px" direction="column">
                            <DialogContentText>
                                <b>Description:</b> {recipeDetails.recipeDescription}
                            </DialogContentText>

                            <DialogContentText >
                                <b>Preparation Time:</b> {recipeDetails.recipePreparationTime / 60} min
                            </DialogContentText>


                            <DialogContentText>
                                <b>Cooking Time:</b> {recipeDetails.recipeCookingTime / 60} min
                            </DialogContentText>

                            <Grid container direction="column">
                                <DialogContentText>
                                    <b>Ingredients:</b>
                                </DialogContentText>
                                <List>
                                    {selectedRecipe.ingredientsList.map((ingredient, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                <FiberManualRecordIcon fontSize="10px" />
                                            </ListItemIcon>

                                            <ListItemText primary={ingredient} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>

                            {/* Display collections */}
                            {recipeDetails.collectionList.length !== 0 && <Grid container direction="column">
                                <DialogContentText>
                                    <b>Collections:</b>
                                </DialogContentText>
                                <List>
                                    {recipeDetails.collectionList.map((collection, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                <FiberManualRecordIcon fontSize="10px" />
                                            </ListItemIcon>

                                            <ListItemText primary={collection} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>}

                            {/* Display keywords */}
                            {recipeDetails.keywords.length !== 0 && <Grid container direction="column">
                                <DialogContentText>
                                    <b>Keywords:</b>
                                </DialogContentText>
                                <List>
                                    {recipeDetails.keywords.map((keyword, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                <FiberManualRecordIcon fontSize="10px" />
                                            </ListItemIcon>

                                            <ListItemText primary={keyword} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>}

                            {/* Display diet types */}
                            {recipeDetails.dietTypes.length !== 0 && <Grid container direction="column">
                                <DialogContentText>
                                    <b>Diet Types:</b>
                                </DialogContentText>
                                <List>
                                    {recipeDetails.dietTypes.map((dietType, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                <FiberManualRecordIcon fontSize="10px" />
                                            </ListItemIcon>

                                            <ListItemText primary={dietType} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>}

                            {/* Display similar recipes */}
                            {recipeDetails.similarRecipes.length !== 0 && <Grid container direction="column">
                                <DialogContentText>
                                    <b>Similar recipes:</b>
                                </DialogContentText>
                                <List>
                                    {recipeDetails.similarRecipes.map((similarRecipe, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <StarRate fontSize="10px" />
                                            </ListItemAvatar>

                                            <ListItemText
                                                primary={
                                                    <Grid container component={'span'} gap={"3px"} direction="column">
                                                        <Grid item>
                                                            <Typography color="primary" component={'span'}>
                                                                Similarity factor {Math.round(similarRecipe.similarity.toFixed(2) * 100)}%
                                                            </Typography>
                                                        </Grid>

                                                        <Grid item>
                                                            <Typography component={'span'}>
                                                                {similarRecipe.recipeName}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>}
                                                secondary={similarRecipe.recipeDescription}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>}
                        </Grid>
                    </DialogContent>

                </Dialog>)}
        </Grid>
    );
}

export default RecipeDetailsDialog;
import React, { useState, useEffect } from 'react';
import {
    Card, CardContent, Table, TableHead, TableBody,
    TableRow, TableCell, TableContainer, TablePagination,
    LinearProgress, Grid, Dialog, DialogTitle, DialogContent, DialogContentText,
    List, ListItem, ListItemText, ListItemIcon, TextField, Autocomplete
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

function RecipesCard({ areRecipesLoading, recipes, driver }) {
    const rowsPerPage = 20;

    const [page, setPage] = useState(0);
    const [openPopUp, setOpenPopUp] = useState(false);

    const [selectedRecipe, setSelectedRecipe] = useState();
    const [recipeDetails, setRecipeDetails] = useState();
    const [areRecipeDetailsLoading, setAreRecipeDetailsLoading] = useState();

    const [searchedRecipes, setSearchedRecipes] = useState([]);

    const [allIngredients, setAllIngredients] = useState([]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleClosePopUp = () => {
        setOpenPopUp(false);
    };

    const handleRowClick = async (recipe) => {
        setSelectedRecipe(recipe);
        setOpenPopUp(true);

        setAreRecipeDetailsLoading(true);

        const { records } = await driver.executeQuery(
            "MATCH (r:Recipe {name: $recipeName}) " +
            "RETURN r.description as recipeDescription, r.preparationTime as recipePreparationTime, " +
            "r.cookingTime as recipeCookingTime", { recipeName: recipe.recipeName }
        )

        setRecipeDetails(
            {
                recipeDescription: records[0].get('recipeDescription'),
                recipePreparationTime: Number(records[0].get('recipePreparationTime').low),
                recipeCookingTime: Number(records[0].get('recipeCookingTime').low)
            })

        setAreRecipeDetailsLoading(false);
    }

    useEffect(() => {
        if (!areRecipesLoading) {
            setSearchedRecipes(recipes);
        }
    }, [areRecipesLoading]);

    const handleSearchChange = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const searchTerms = searchTerm.split(" ").filter(term => term);
        const filteredRecipes = recipes.filter(recipe =>
            searchTerms.every(term =>
                recipe.recipeName.toLowerCase().includes(term)
            )
        );
        setSearchedRecipes(filteredRecipes);
    };

    async function getAllIngredients() {
        const { records } = await driver.executeQuery(
          "MATCH (i:Ingredient) " +
          "RETURN i.name as ingredientsName " +
          "ORDER BY toLower(trim(i.name)) "
        )

        setAllIngredients(records.map(record => record.get('ingredientsName')));
    }
    
    useEffect(() => {
        getAllIngredients();
    });

    return (
        <Grid container direction="row" gap="20px">
            <Grid item container style={{ width: '14%' }} direction="column">
                <Autocomplete
                    fullWidth
                    disablePortal
                    options = {allIngredients}
                    renderInput={(params) => <TextField {...params} label="Ingredints" />}
                />
            </Grid>
            <Grid item container direction="column" gap="15px" style={{ width: '84%' }}>
                <Grid item style={{ width: '100%' }}>
                    <TextField
                        fullWidth
                        label="Search recipe"
                        variant="filled"
                        onChange={handleSearchChange} />
                </Grid>
                <Grid item style={{ width: '100%' }}>
                    <Card>
                        {areRecipesLoading ?
                            (
                                <LinearProgress />
                            ) : (
                                <CardContent>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        <strong>Name</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Author</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Number of ingredients</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Skill Level</strong>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {searchedRecipes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((recipe, index) => (
                                                    <TableRow key={index} onClick={() => handleRowClick(recipe)}>
                                                        <TableCell>{recipe.recipeName}</TableCell>
                                                        <TableCell>{recipe.authorName}</TableCell>
                                                        <TableCell>{recipe.ingredientCount}</TableCell>
                                                        <TableCell>{recipe.skillLevel}</TableCell>
                                                    </TableRow>))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        component="div"
                                        count={searchedRecipes.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        rowsPerPageOptions={[]}
                                    />
                                </CardContent>)}
                    </Card>
                </Grid>
                <Grid item>
                    {areRecipeDetailsLoading == null || areRecipeDetailsLoading === true ?
                        (<Dialog open={openPopUp} onClose={handleClosePopUp} fullWidth>
                            <DialogContent>
                                <LinearProgress />
                            </DialogContent>
                        </Dialog>)
                        :
                        (<Dialog open={openPopUp} onClose={handleClosePopUp}>
                            <DialogTitle>{selectedRecipe.recipeName}</DialogTitle>
                            <DialogContent style={{ overflow: 'hidden' }}>
                                <DialogContentText>
                                    <b>Description:</b> {recipeDetails.recipeDescription}
                                </DialogContentText>
                            </DialogContent>

                            <DialogContent style={{ overflow: 'hidden' }}>
                                <DialogContentText>
                                    <b>Preparation Time:</b> {recipeDetails.recipePreparationTime / 60} min
                                </DialogContentText>
                            </DialogContent>

                            <DialogContent style={{ overflow: 'hidden' }}>
                                <DialogContentText>
                                    <b>Cooking Time:</b> {recipeDetails.recipeCookingTime / 60} min
                                </DialogContentText>
                            </DialogContent>

                            <DialogContent>
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

                            </DialogContent>
                        </Dialog>)}
                </Grid>
            </Grid>
        </Grid>
    );
}

export default RecipesCard;
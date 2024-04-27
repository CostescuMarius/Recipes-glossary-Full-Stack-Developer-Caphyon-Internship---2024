import React, { useState, useEffect, useContext } from 'react';

import RecipesContext from '../context/RecipesContext';

import {Card, CardContent, Table, TableHead, TableBody,
    TableRow, TableCell, TableContainer, TablePagination,
    LinearProgress, Grid, TextField, Autocomplete, Paper,
    Typography, IconButton} from '@mui/material';

import SortIcon from '@mui/icons-material/Sort';
import RecipeDetailsDialog from './RecipeDetailsDialog';
import AuthorRecipesDialog from './AuthorRecipesDialog';

/**
 * React component for displaying a table containing recipes and actions on them.
 * 
 * @returns {JSX.Element} The JSX representation of the RecipesCard component.
 */
function RecipesCard() {
    // Access Neo4j driver, recipes loading status, and recipes from context
    const { driver, areRecipesLoading, recipes } = useContext(RecipesContext);

    // Number of recipes to display per table page
    const rowsPerPage = 20;

    // State variables for table pagination
    const [page, setPage] = useState(0);

    // State variables for selected recipe
    const [openRecipePopUp, setOpenRecipePopUp] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState();

    // State variables for selected author
    const [openAuthorRecipesPopUp, setOpenAuthorRecipesPopUp] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState();
    
    // State variables for user search
    const [userSearchValue, setUserSearchValue] = useState("");

    // State variables for all and selected ingredients
    const [allIngredients, setAllIngredients] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);

    // State variables for recipes shown after searching and filtering
    const [filteredRecipes, setFilteredRecipes] = useState([]);

    // State variables for keeping sorting ording of recipes by ingredients and skill level
    const [sortingByIngredientsNoOrder, setSortingByIngredientsNoOrder] = useState("");
    const [sortingBySkillLevel, setSortingBySkillLevel] = useState("");

    // Initially consider recipes being filterd
    useEffect(() => {
        if (!areRecipesLoading) {
            setFilteredRecipes(recipes);
        }
    }, [areRecipesLoading]);

    /**
     * Function to handle page change in pagination.
     */
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

     /**
     * Function to close the recipe details dialog.
     */
    const handleClosePopUp = () => {
        setOpenRecipePopUp(false);
    };

    /**
     * Function to handle recipe click and open the recipe dialog with the selected recipe.
     */
    const handleRecipeClick = (recipe) => {
        setSelectedRecipe(recipe);
        setOpenRecipePopUp(true);
    }

    /**
     * Function to handle author name click and open the author recipes dialog.
     */
    const handleAuthorCellClick = (authorName) => {
        setOpenAuthorRecipesPopUp(true);
        setSelectedAuthor(authorName);
    }

    // Function to close the author recipes dialog.
    const handleCloseAuthorPopUp = () => {
        setOpenAuthorRecipesPopUp(false);
    };

    /**
     * Function to get all ingredients from the Neo4j database.
     */
    async function getAllIngredients() {
        const { records } = await driver.executeQuery(
            "MATCH (i:Ingredient) " +
            "RETURN i.name as ingredientsName " +
            "ORDER BY toLower(trim(i.name)) "
        )

        setAllIngredients(records.map(record => record.get('ingredientsName')));
    }

    // Get all ingredients data on component mount
    useEffect(() => {
        getAllIngredients();
    }, []);

    // Function to add ingredient selected in list.
    const handleIngredientSelect = (event, newValue) => {
        if (newValue !== "" && newValue && !selectedIngredients.includes(newValue)) {
            setSelectedIngredients([...selectedIngredients, newValue]);
            event.target.value = "";
        }
    };

    // Function to remove selected ingredient from list.
    const handleRemoveSelectedIngredient = (index) => {
        const updatedIngredients = [...selectedIngredients];
        updatedIngredients.splice(index, 1);
        setSelectedIngredients(updatedIngredients);
    };

    // Function to handle user search input.
    const handleSearchChange = (event) => {
        const value = event.target.value;

        setUserSearchValue(value);
    };

    // Function to search recipes based on user input.
    const searchRecipesByUserInput = () => {
        if (userSearchValue === "") {
            return recipes;
        }
        else {
            const searchTerms = userSearchValue.toLowerCase().split(" ").filter(term => term);
            return recipes.filter(recipe =>
                searchTerms.every(term =>
                    recipe.recipeName.toLowerCase().includes(term)
                )
            );
        }
    }

    // Function to filter recipes based on selected ingredients.
    const filterRecipesByIngredients = (filteredRecipesBySearch) => {
        if (selectedIngredients.length === 0) {
            setFilteredRecipes(filteredRecipesBySearch);
        }
        else if (selectedIngredients.length !== 0) {
            const filteredRecipesByIngredients = filteredRecipesBySearch.filter(recipe => {
                return selectedIngredients.every(ingredient => recipe.ingredientsList.includes(ingredient));
            });
            setFilteredRecipes(filteredRecipesByIngredients);
        }
    }

    /**
     * Call functions for search and filter any time when user input changes or one ingredient is added or removed from list
     */ 
    useEffect(() => {
        if (!areRecipesLoading) {
            setPage(0);
            setSortingByIngredientsNoOrder("");

            setSortingBySkillLevel("");

            let filteredRecipesBySearch = searchRecipesByUserInput();

            filterRecipesByIngredients(filteredRecipesBySearch)
        }
    }, [selectedIngredients, userSearchValue]);

    // Function to handle sorting recipes by number of ingredients.
    const handleSortByIngredientsNo = () => {
        const sortedByIngredintsNoRecipes = [...filteredRecipes];

        if (sortingByIngredientsNoOrder === "ascending" || sortingByIngredientsNoOrder === "") {
            sortedByIngredintsNoRecipes.sort((a, b) => a.ingredientsList.length - b.ingredientsList.length);
            setSortingByIngredientsNoOrder("descending");
        } else if (sortingByIngredientsNoOrder === "descending") {
            sortedByIngredintsNoRecipes.sort((a, b) => b.ingredientsList.length - a.ingredientsList.length);
            setSortingByIngredientsNoOrder("ascending");
        }


        setFilteredRecipes(sortedByIngredintsNoRecipes);
    }

    // Function to handle sorting recipes by skill level.
    const handleSortBySkillLevel = () => {
        const sortedBySkillLevel = [...filteredRecipes];

        const skillLevelsOrder = {
            "Easy": 1,
            "More effort": 2,
            "A challenge": 3
        };

        if (sortingBySkillLevel === "ascending" || sortingBySkillLevel === "") {
            sortedBySkillLevel.sort((a, b) => skillLevelsOrder[a.skillLevel] - skillLevelsOrder[b.skillLevel]);
            setSortingBySkillLevel("descending");
        } else if (sortingBySkillLevel === "descending") {
            sortedBySkillLevel.sort((a, b) => skillLevelsOrder[b.skillLevel] - skillLevelsOrder[a.skillLevel]);
            setSortingBySkillLevel("ascending")
        }


        setFilteredRecipes(sortedBySkillLevel);
    }

    return (
        <Grid container direction="row" gap="20px">
            {/* Grid for selecting adding and removing ingredients for filtering*/}
            <Grid item container style={{ width: '14%' }} direction="column" gap="20px">
                <Grid item>
                    <Autocomplete
                        fullWidth
                        disablePortal
                        options={allIngredients}
                        onChange={handleIngredientSelect}
                        renderInput={(params) => <TextField {...params} label="Ingredints" />}
                    />
                </Grid>
                <Grid item container gap="10px" direction="column">
                    {selectedIngredients.map((ingredient, index) => (
                        <Grid item key={index}>
                            <Paper elevation={3} style={{ padding: '10px' }}>
                                <Typography>{ingredient}</Typography>

                                <Grid container justifyContent="flex-end">
                                    <IconButton onClick={() => handleRemoveSelectedIngredient(index)}>
                                        <Typography color="error">Remove</Typography>
                                    </IconButton>
                                </Grid>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Grid>

            {/* Grid for displaying recipes table */}
            <Grid item container direction="column" gap="15px" style={{ width: '84%' }}>
                <Grid item style={{ width: '100%' }}>
                    <TextField
                        fullWidth
                        label="Search recipe"
                        variant="filled"
                        value={userSearchValue}
                        onChange={handleSearchChange} />
                </Grid>
                <Grid item style={{ width: '100%' }}>
                    <Card variant="outlined">
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
                                                        <IconButton onClick={handleSortByIngredientsNo}>
                                                            <SortIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Skill Level</strong>
                                                        <IconButton onClick={handleSortBySkillLevel}>
                                                            <SortIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            {/* Display filtered recipes */}
                                            <TableBody>
                                                {filteredRecipes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((recipe, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell onClick={() => handleRecipeClick(recipe)}>
                                                            {recipe.recipeName}
                                                        </TableCell>

                                                        <TableCell onClick={() => { handleAuthorCellClick(recipe.authorName) }}>
                                                            {recipe.authorName}
                                                        </TableCell>
                                                        <TableCell>{recipe.ingredientCount}</TableCell>
                                                        <TableCell>{recipe.skillLevel}</TableCell>
                                                    </TableRow>))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        component="div"
                                        count={filteredRecipes.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        rowsPerPageOptions={[]}
                                    />
                                </CardContent>)}
                    </Card>
                </Grid>
                
                {/* Dialog for displaying recipe details */}
                <RecipeDetailsDialog 
                    openRecipePopUp={openRecipePopUp}
                    handleClosePopUp={handleClosePopUp} 
                    selectedRecipe={selectedRecipe}/>
                    
                {/* Dialog for displaying recipe details */}
                <AuthorRecipesDialog
                    openAuthorRecipesPopUp={openAuthorRecipesPopUp}
                    handleCloseAuthorPopUp={handleCloseAuthorPopUp}
                    selectedAuthor={selectedAuthor}/>
            </Grid>
        </Grid>
    );
}

export default RecipesCard;
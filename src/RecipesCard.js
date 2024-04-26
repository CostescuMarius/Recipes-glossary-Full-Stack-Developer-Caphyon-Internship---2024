import React, { useState, useEffect } from 'react';
import {
    Card, CardContent, Table, TableHead, TableBody,
    TableRow, TableCell, TableContainer, TablePagination,
    LinearProgress, Grid, Dialog, DialogTitle, DialogContent, DialogContentText,
    List, ListItem, ListItemText, ListItemIcon, TextField, Autocomplete, Paper,
    Typography, IconButton
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SortIcon from '@mui/icons-material/Sort';

import Client from '@elastic/elasticsearch';

function RecipesCard({ areRecipesLoading, recipes, driver }) {
    const rowsPerPage = 20;

    const [page, setPage] = useState(0);
    const [openRecipePopUp, setOpenRecipePopUp] = useState(false);

    const [selectedRecipe, setSelectedRecipe] = useState();
    const [recipeDetails, setRecipeDetails] = useState();
    const [areRecipeDetailsLoading, setAreRecipeDetailsLoading] = useState();

    const [userSearchValue, setUserSearchValue] = useState("");

    const [allIngredients, setAllIngredients] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);

    const [filteredRecipes, setFilteredRecipes] = useState([]);

    const [openAuthorRecipesPopUp, setOpenAuthorRecipesPopUp] = useState(false);
    const [authorRecipes, setAuthorRecipes] = useState();
    const [areAuthorRecipesLoading, setAreAuthorRecipesLoading] = useState();

    const [sortingByIngredientsNoOrder, setSortingByIngredientsNoOrder] = useState("");
    const [sortingBySkillLevel, setSortingBySkillLevel] = useState("");

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleClosePopUp = () => {
        setOpenRecipePopUp(false);
    };

    const handleRowClick = async (recipe) => {
        setSelectedRecipe(recipe);
        setOpenRecipePopUp(true);

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
            "collect(DISTINCT d.name) as dietTypes", { recipeName: recipe.recipeName }
        )

        setRecipeDetails(
            {
                recipeDescription: records[0].get('recipeDescription'),
                recipePreparationTime: Number(records[0].get('recipePreparationTime').low),
                recipeCookingTime: Number(records[0].get('recipeCookingTime').low),
                collectionList: records[0].get('collectionList'),
                keywords: records[0].get('keywords'),
                dietTypes: records[0].get('dietTypes')
            })

        setAreRecipeDetailsLoading(false);
    }

    useEffect(() => {
        if (!areRecipesLoading) {
            setFilteredRecipes(recipes);
        }
    }, [areRecipesLoading]);

    const handleSearchChange = (event) => {
        const value = event.target.value;

        setUserSearchValue(value);
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
    }, []);

    const handleIngredientSelect = (event, newValue) => {
        if (newValue !== "" && newValue && !selectedIngredients.includes(newValue)) {
            setSelectedIngredients([...selectedIngredients, newValue]);
            event.target.value = "";
        }
    };

    const handleRemoveSelectedIngredient = (index) => {
        const updatedIngredients = [...selectedIngredients];
        updatedIngredients.splice(index, 1);
        setSelectedIngredients(updatedIngredients);
    };

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

    useEffect(() => {
        if (!areRecipesLoading) {
            setPage(0);
            setSortingByIngredientsNoOrder("");

            setSortingBySkillLevel("");

            let filteredRecipesBySearch = searchRecipesByUserInput();

            filterRecipesByIngredients(filteredRecipesBySearch)
        }
    }, [selectedIngredients, userSearchValue]);

    const handleAuthorCellClick = async (authorName) => {
        setOpenAuthorRecipesPopUp(true);

        setAreAuthorRecipesLoading(true);

        const { records } = await driver.executeQuery(
            "MATCH (a:Author {name: $authorName})-[:WROTE]->(r:Recipe) " +
            "RETURN COLLECT(r.name) as recipesAuthorList ", { authorName: authorName }
        )

        setAuthorRecipes({
            authorName: authorName,
            recipesAuthorList: records[0].get('recipesAuthorList')
        })

        setAreAuthorRecipesLoading(false);
    }

    const handleCloseAuthorPopUp = () => {
        setOpenAuthorRecipesPopUp(false);
    };

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
                                            <TableBody>
                                                {filteredRecipes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((recipe, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell onClick={() => handleRowClick(recipe)}>
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
                <Grid item>
                    {areRecipeDetailsLoading == null || areRecipeDetailsLoading === true ?
                        (<Dialog open={openRecipePopUp} onClose={handleClosePopUp} fullWidth>
                            <DialogContent>
                                <LinearProgress />
                            </DialogContent>
                        </Dialog>)
                        :
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
                                </Grid>
                            </DialogContent>

                        </Dialog>)}
                </Grid>
                <Grid item>
                    {areAuthorRecipesLoading == null || areAuthorRecipesLoading === true ?
                        (<Dialog open={openAuthorRecipesPopUp} onClose={handleCloseAuthorPopUp} fullWidth>
                            <DialogContent>
                                <LinearProgress />
                            </DialogContent>
                        </Dialog>)
                        :
                        (<Dialog open={openAuthorRecipesPopUp} onClose={handleCloseAuthorPopUp}>
                            <DialogTitle>Published recipes by <b>{authorRecipes.authorName}</b></DialogTitle>

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
            </Grid>
        </Grid>
    );
}

export default RecipesCard;
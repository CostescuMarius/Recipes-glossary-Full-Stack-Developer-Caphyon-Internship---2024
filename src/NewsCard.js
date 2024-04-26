import React, { useEffect, useState } from "react";

import {
    Grid, LinearProgress, Card, CardContent,
    List, ListItem, ListItemText,
    Typography,
    ListItemAvatar
} from "@mui/material";

import TurnedInNotIcon from '@mui/icons-material/TurnedInNot';

function NewsCard({ driver }) {
    const [areInfoLoading, setAreInfoLoading] = useState(true);

    const [mostCommonIngredients, setMostCommonIngredients] = useState([]);
    const [mostProlificAuthors, setMostProlificAuthors] = useState([]);
    const [mostComplexRecipes, setMostComplexRecipes] = useState([]);

    const get5MostCommonIngredients = async () => {
        const { records } = await driver.executeQuery(
            "MATCH (r:Recipe)-[:CONTAINS_INGREDIENT]->(i:Ingredient) " +
            "RETURN i.name as ingredintName, count(i) as ingredientNo " +
            "ORDER BY ingredientNo DESC " +
            "LIMIT 5"
        )

        setMostCommonIngredients(records.map(record => ({
            ingredientName: record.get('ingredintName'),
            ingredientNo: Number(record.get('ingredientNo').low)
        })));
    }

    const get5MostProlificAuthors = async () => {
        const { records } = await driver.executeQuery(
            "MATCH (a:Author)-[:WROTE]->(r:Recipe) " +
            "RETURN a.name as authorName, count(r) as noRecipes " +
            "ORDER BY noRecipes DESC " +
            "LIMIT 5"
        )

        setMostProlificAuthors(records.map(record => ({
            authorName: record.get('authorName'),
            noRecipes: Number(record.get('noRecipes').low)
        })));
    }

    const get5MostComplexRecipes = async () => {
        const { records } = await driver.executeQuery(
            "MATCH (a:Author)-[:WROTE]->(r:Recipe) " +
            "MATCH (r)-[:CONTAINS_INGREDIENT]->(i:Ingredient) " +
            "RETURN a.name as authorName, r.name as recipeName, count(i) as ingredientsNo " +
            "ORDER BY ingredientsNo DESC " +
            "LIMIT 5"
        )

        setMostComplexRecipes(records.map(record => ({
            recipeName: record.get('recipeName'),
            authorName: record.get('authorName'),
            ingredientsNo: Number(record.get('ingredientsNo').low)
        })));
    }

    useEffect(() => {
        Promise.all([
            get5MostCommonIngredients(),
            get5MostProlificAuthors(),
            get5MostComplexRecipes()
        ]).then(() => {
            setAreInfoLoading(false);
        })
    }, []);

    return (
        <Grid>
            <Card variant="outlined" style={{borderRadius: "10px", marginLeft: '10px', marginRight: '10px',  marginBottom: '10px'}}>
                {areInfoLoading ?
                    (
                        <LinearProgress />
                    ) : (
                        <CardContent>
                            <Grid container justifyContent="space-between" direction="row">
                                <Grid item container direction="column" style={{ width: "fit-content" }}>
                                    <Grid item>
                                        <Typography variant="h6" fontWeight="bold">Most common ingredients</Typography>
                                    </Grid>
                                    <Grid item>
                                        <List>
                                            {mostCommonIngredients.map((commonIngredient, index) => (
                                                <ListItem key={index}>
                                                    <ListItemAvatar>
                                                        <TurnedInNotIcon/>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={commonIngredient.ingredientName}
                                                        secondary={
                                                            <Grid item component={'span'}>
                                                                <Typography component={'span'}>Aparitions: {commonIngredient.ingredientNo}</Typography>
                                                            </Grid>
                                                        } />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Grid>
                                </Grid>

                                <Grid item container direction="column" style={{ width: "fit-content" }}>
                                    <Grid item>
                                        <Typography  variant="h6" fontWeight="bold">Most prolific authors</Typography>
                                    </Grid>
                                    <Grid item>
                                        <List>
                                            {mostProlificAuthors.map((prolificAuthor, index) => (
                                                <ListItem key={index}  sx={{ display: 'flex', justifyContent: 'center' }}>
                                                    <ListItemAvatar>
                                                        <TurnedInNotIcon/>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={prolificAuthor.authorName}
                                                        secondary={
                                                            <Grid item component={'span'}>
                                                                <Typography component={'span'}>Recipes: {prolificAuthor.noRecipes}</Typography>
                                                            </Grid>
                                                        } />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Grid>
                                </Grid>

                                <Grid item container direction="column" style={{ width: "fit-content" }}>
                                    <Grid item>
                                        <Typography  variant="h6" fontWeight="bold">Most complex recipes</Typography>
                                    </Grid>
                                    <Grid item>
                                        <List>
                                            {mostComplexRecipes.map((complexRecipe, index) => (
                                                <ListItem key={index}>
                                                    <ListItemAvatar>
                                                        <TurnedInNotIcon/>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={complexRecipe.recipeName}
                                                        secondary={
                                                            <Grid container component={'span'} direction="column">
                                                                <Grid item component={'span'}>
                                                                    <Typography component={'span'}>Author: {complexRecipe.authorName}</Typography>
                                                                </Grid>

                                                                <Grid item component={'span'}>
                                                                    <Typography component={'span'}>Ingredients: {complexRecipe.ingredientsNo}</Typography>
                                                                </Grid>
                                                            </Grid>
                                                        } />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Grid>
                                </Grid>

                            </Grid>

                        </CardContent>)}
            </Card>
        </Grid>
    );
}

export default NewsCard;
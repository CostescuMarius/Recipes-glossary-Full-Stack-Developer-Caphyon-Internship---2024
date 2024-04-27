import neo4j from 'neo4j-driver';
import { useState, useEffect } from 'react';
import { Grid } from '@mui/material';

import AppHeader from './shared/AppHeader';
import RecipesCard from './components/RecipesCard';
import NewsCard from './components/NewsCard';

import "./css/PageStyles.css";
import RecipesContext from './context/RecipesContext';

/**
 * Homepage of the application.
 * 
 * @returns {JSX.Element} The JSX representation of the Homepage component.
 */
function HomePage() {
  // Neo4j driver setup
  const driver = neo4j.driver('neo4j://34.232.57.230:7687', neo4j.auth.basic('neo4j', 'internship-2024'));

  // State variables for recipes
  const [recipes, setRecipes] = useState();
  const [areRecipesLoading, setAreRecipesLoading] = useState(true);

  /**
   * Function for getting recipes data from Neo4j database.
   */
  async function getRecipes() {
    const { records } = await driver.executeQuery(
      "MATCH (a:Author)-[:WROTE]->(r:Recipe) " +
      "MATCH (r)-[:CONTAINS_INGREDIENT]->(i:Ingredient) " +
      "RETURN a.name AS authorName, " +
      "r.name AS recipeName, r.description as recipeDescription, r.skillLevel AS recipeSkillLevel, " +
      "COLLECT(i.name) as ingredientsList " +
      "ORDER BY toLower(trim(r.name)) "
    )

    setRecipes(records.map(record => ({
      recipeName: record.get('recipeName'),
      authorName: record.get('authorName'),
      ingredientCount: record.get('ingredientsList').length,
      skillLevel: record.get('recipeSkillLevel'),
      ingredientsList: record.get('ingredientsList'),
      recipeDescription: record.get('recipeDescription')
    })));

    setAreRecipesLoading(false);
  }

  // Get recipes data on component mount
  useEffect(() => {
    getRecipes();
  }, []);

  return (
    <RecipesContext.Provider value={{ driver, areRecipesLoading, recipes  }}>
      <Grid container direction={"column"} gap='20px'>
        {/*Header*/}
        <Grid item>
          <AppHeader />
        </Grid>

        {/*Recipes table*/}
        <Grid item style={{ maxHeight: "1300px" }}>
          <RecipesCard />
        </Grid>

        {/*Info about ranking*/}
        <Grid item>
          <NewsCard />
        </Grid>
      </Grid>
    </RecipesContext.Provider>
  );
}

export default HomePage;

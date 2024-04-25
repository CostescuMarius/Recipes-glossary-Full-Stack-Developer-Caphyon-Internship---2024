import neo4j from 'neo4j-driver';
import { useState, useEffect } from 'react';
import { Grid } from '@mui/material';

import RecipesCard from './RecipesCard';
import AppHeader from './AppHeader';

function App() {
  const [recipes, setRecipes] = useState();
  const [areRecipesLoading, setAreRecipesLoading] = useState(true);

  const driver = neo4j.driver('neo4j://34.232.57.230:7687', neo4j.auth.basic('neo4j', 'internship-2024'));

  async function getRecipes() {
    const { records } = await driver.executeQuery(
      "MATCH (a:Author)-[:WROTE]->(r:Recipe) MATCH (r)-[:CONTAINS_INGREDIENT]->(i:Ingredient) " +
      "RETURN a.name AS authorName, r.name AS recipeName, r.skillLevel AS recipeSkillLevel, COLLECT(i.name) as ingredientsList " +
      "ORDER BY toLower(trim(r.name)) "
    )

    setRecipes(records.map(record => ({
      recipeName: record.get('recipeName'),
      authorName: record.get('authorName'),
      ingredientCount: record.get('ingredientsList').length,
      skillLevel: record.get('recipeSkillLevel'),
      ingredientsList: record.get('ingredientsList'),
    })));

    setAreRecipesLoading(false);
  }

  useEffect(() => {
    getRecipes();
  }, []);

  return (
    <Grid container direction={"column"} gap='20px'>
      <Grid item>
        <AppHeader />
      </Grid>
      <Grid item>
        <RecipesCard
          areRecipesLoading={areRecipesLoading}
          recipes={recipes}
          driver={driver} />
      </Grid>

    </Grid>
  );
}

export default App;

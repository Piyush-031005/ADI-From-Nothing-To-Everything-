git add index.html package.json vite.config.js src/main.js
git commit -m "Initialize core ADI experience base"
git rm src/style.css
git add src/adi-style.css
git commit -m "Add global CSS styles for ADI"
git add src/Experience.js src/Renderer.js
git commit -m "Update Experience and Renderer core"
git add src/ScrollController.js
git commit -m "Implement Scroll Controller logic"
git add src/eras/EraDirector.js
git commit -m "Add EraDirector to manage sequential eras"
git add src/eras/Era1_Singularity.js
git commit -m "Implement Era 1: Singularity visualization"
git add src/eras/Era2_BigBang.js
git commit -m "Implement Era 2: Big Bang explosion effect"
git add src/eras/Era3_Stars.js
git commit -m "Implement Era 3: Stars and Galaxies"
git add src/eras/Era4_SolarSystem.js src/shaders/sun/
git commit -m "Introduce Solar System and Sun shaders"
git add src/eras/Era4_BlackHole.js src/eras/blackhole/
git commit -m "Integrate High-Fidelity Black Hole"
git add src/eras/Era5_Earth.js src/shaders/planet/fragment.glsl
git commit -m "Add Earth generation with realistic shaders"
git add src/eras/Era7_Cambrian.js
git commit -m "Integrate Era 7: Cambrian Explosion cinematic backdrop"
git add src/eras/Era8_Dinosaurs.js
git commit -m "Integrate Era 8: Dinosaurs and Asteroid impact"
git add src/eras/Era9_Humans.js
git commit -m "Integrate Era 9: Human Evolution cinematic backdrop"
git add src/eras/Era10_Future.js
git commit -m "Integrate Era 10: The Future cinematic backdrop"
git add src/Camera.js
git commit -m "Implement 360 interactive Camera OrbitControls"
git add src/shaders/final/fragment.glsl
git commit -m "Final post-processing shader updates"
git add public/
git commit -m "Add public assets directory"
git add package-lock.json fix.cjs response.html
git commit -m "Lockfile generation and minor fixes"

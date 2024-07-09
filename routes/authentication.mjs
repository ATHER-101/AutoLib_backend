import { Router } from "express";
import passport from 'passport';

const router = Router();

router.get("/api/auth/google", passport.authenticate("google"));

router.get("/api/auth/google/callback", passport.authenticate("google", {
    failureRedirect: "/api/auth/failed"
}), (req, res) => {
    console.log('Authentication successful, redirecting to frontend.');
    res.redirect(process.env.FRONTEND);
});

router.get("/api/auth/logout", (request, response) => {
    request.logout((error) => {
        if (error) {
            return console.log(error);
        }
        response.redirect(process.env.FRONTEND);
    });
});

router.get("/api/auth/failed", (request, response) => {
    response.redirect(`${process.env.FRONTEND}/auth-failed`);
});

router.get("/api/auth/status", (request, response) => {
    console.log("Session cookie:", request.headers.cookie); // Log cookie headers
    if (request.user) {
        console.log("User authenticated:", request.user);
        response.send({ status: "authorised", user: request.user });
    } else {
        console.log("User not authenticated");
        response.status(401).send({ status: "unauthorised" });
    }
});

export default router;
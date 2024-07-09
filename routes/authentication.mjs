import { Router } from "express";
import passport from 'passport';

const router = Router();

router.get("/api/auth/google", passport.authenticate("google"));

router.get("/api/auth/google/callback", passport.authenticate("google",{
    successRedirect: process.env.FRONTEND,
    failureRedirect:"/api/auth/failed"
}));

router.get("/api/auth/logout", (request,response)=>{
    request.logout((error) => {
        if (error) {
            return console.log(error);
        }
        response.redirect(process.env.FRONTEND);
    });
});

router.get("/api/auth/failed",(request,response)=>{
    response.redirect(`${process.env.FRONTEND}/auth-failed`);
});

router.get("/api/auth/status", (request, response) => {
    return request.user ? response.send({status:"authorised",user:request.user}) : response.status(401).send({status:"unauthorised"});
});

export default router;
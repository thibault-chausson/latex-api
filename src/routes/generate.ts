import { Router } from "express";
import { postGenerate } from "../controllers/generate";

const router: Router = Router();

router.post("/", postGenerate);


export default router;
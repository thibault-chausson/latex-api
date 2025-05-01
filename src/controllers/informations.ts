import type { Request, Response } from "express";
import { ALLOWED_EXTENSIONS, BLACKLISTED_COMMANDS } from "../config/const";

export const getBlacklistedCommands = (req: Request, res: Response) => {
  res.json({
    blacklistedCommands: BLACKLISTED_COMMANDS,
  });
};

export const getAllowedExtensions = (req: Request, res: Response) => {
  res.json({
    allowedExtensions: ALLOWED_EXTENSIONS,
  });
};

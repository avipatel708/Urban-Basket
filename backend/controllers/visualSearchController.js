import { runVisualSearch } from "../services/visualSearchService.js"

export const visualSearch = async (req, res, next) => {
  try {
    let hints = {}
    if (req.body?.hints) {
      try {
        hints = typeof req.body.hints === "string" ? JSON.parse(req.body.hints) : req.body.hints
      } catch {
        hints = {}
      }
    }

    const buffer = req.file?.buffer || null

    if (!buffer && (!hints.labels?.length && !hints.intents?.length)) {
      return res.status(400).json({ error: "Upload an image or provide visual hints." })
    }

    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"])
    if (req.file && !allowed.has(req.file.mimetype)) {
      return res.status(400).json({ error: "Supported formats: JPG, PNG, WEBP." })
    }

    const result = await runVisualSearch(buffer, hints)
    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

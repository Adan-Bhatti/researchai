from typing import List

DEPTH_INSTRUCTIONS = {
    "quick": "Conduct a quick, focused research scan. Return only the most prominent, well-known, and easily discoverable results.",
    "standard": "Conduct standard-depth research. Go beyond obvious results to find quality, verified sources with good engagement.",
    "deep": "Conduct deep research. Explore sub-communities, niche corners, and less obvious but high-quality sources with detailed coverage.",
    "exhaustive": "Conduct exhaustive research. Leave no stone unturned. Explore every available angle, sub-topic, content type, and community source."
}

FORMAT_INSTRUCTIONS = {
    "csv": "Format results as flat, uniform objects with consistent keys suitable for CSV spreadsheet export.",
    "json": "Format results as rich JSON objects with all detail fields populated.",
    "report": "Provide comprehensive descriptions and analysis for each result in a narrative format.",
    "lead_list": "Format as a business lead list: include business name, website URL, potential contact type, and outreach angle.",
    "table": "Present each result in a clean, uniform tabular structure with clearly defined columns.",
    "bullet_summary": "Format each result as a concise bullet-point summary highlighting the most important attributes."
}

PLATFORM_STRATEGIES = {
    "Web": "Search general web sources including blogs, news sites, directories, and informational resources",
    "Reddit": "Search active subreddits, top posts, comment threads, and community discussions with high engagement",
    "Facebook Groups": "Search active Facebook community groups with recent posts and member engagement",
    "Discord": "Search active Discord servers, community invites, and public server directories",
    "LinkedIn": "Search LinkedIn company pages, professional groups, influencer profiles, and industry discussions",
    "GitHub": "Search GitHub repositories by stars/topics/recent activity; include awesome-lists and discussions",
    "Twitter": "Search active Twitter/X accounts, trending hashtags, and community conversations",
    "Product Hunt": "Search Product Hunt product launches, upvoted tools, and maker community discussions",
    "Hacker News": "Search Hacker News threads, Ask HN posts, Show HN submissions, and comment discussions"
}


def generate_prompt(
    platforms: List[str],
    niches: List[str],
    depth: str,
    output_format: str,
    dataset_size: int,
    custom_query: str = ""
) -> str:
    platforms_str = ", ".join(platforms) if platforms else "Web"
    niches_str = ", ".join(niches) if niches else "General Research"

    platform_section = "\n".join([
        f"  - **{p}**: {PLATFORM_STRATEGIES.get(p, 'Search for relevant and high-quality content')}"
        for p in platforms
    ])

    depth_text = DEPTH_INSTRUCTIONS.get(depth, DEPTH_INSTRUCTIONS["standard"])
    format_text = FORMAT_INSTRUCTIONS.get(output_format, FORMAT_INSTRUCTIONS["json"])
    custom_section = f"\n## Additional Research Focus\n{custom_query}\n" if custom_query.strip() else ""
    first_niche = niches[0] if niches else "General"
    niche_slug = first_niche.lower().replace(" ", "_")

    prompt = f"""You are an expert research analyst and data curator with comprehensive knowledge of online platforms, communities, and services.

## Research Objective
- **Topic(s):** {niches_str}
- **Platforms:** {platforms_str}
- **Depth Level:** {depth.upper()}
- **Required Results:** {dataset_size}
{custom_section}
## Research Depth Instructions
{depth_text}

## Platform-Specific Search Strategy
Apply these targeted strategies for each platform:
{platform_section}

## Output Format
{format_text}

## Required Data Fields
Every result MUST include ALL of these exact fields:
- "title": The name/title of the resource, community, or opportunity
- "platform": The source platform (must be one of: {platforms_str})
- "url": Full, properly formatted URL for the specific resource
- "description": A substantive 2-3 sentence description explaining what this is and why it is relevant to {niches_str}
- "relevance_score": Integer 1-10 measuring relevance to {niches_str} (only include if >= 6)
- "confidence_score": Integer 0-100 representing your confidence in the accuracy of this result
- "category": Specific sub-category within {niches_str}
- "tags": JSON array of 3-5 relevant keyword tags (lowercase, use underscores for spaces)
- "engagement_level": One of: "Low", "Medium", "High", "Very High"
- "source_type": Type such as: "Community", "Tool", "Service", "Repository", "Profile", "Article", "Forum", "Marketplace", "Directory"

## Quality Enforcement Rules
1. UNIQUENESS: Every result must be completely unique — no duplicate titles or URLs
2. RELEVANCE: Only include results with relevance_score >= 6
3. DISTRIBUTION: Spread results across different platforms when multiple are selected
4. URL FORMAT: URLs must follow correct platform patterns (reddit.com/r/..., github.com/..., etc.)
5. SPECIFICITY: Descriptions must be specific and informative, not generic
6. REALISM: Only include real or highly plausible resources — no invented sources

## CRITICAL OUTPUT INSTRUCTIONS
- Return ONLY a valid JSON array
- Do NOT include markdown, code blocks, explanations, or any text outside the JSON
- Start your response with [ and end with ]
- Target exactly {dataset_size} results

[
  {{
    "title": "r/{niche_slug} Community Hub",
    "platform": "Reddit",
    "url": "https://reddit.com/r/{niche_slug}",
    "description": "An active subreddit dedicated to {niches_str} discussions with regular posts, resource sharing, and community Q&A. Excellent source for discovering trends and connecting with practitioners in the field.",
    "relevance_score": 9,
    "confidence_score": 88,
    "category": "{first_niche}",
    "tags": ["{niche_slug}", "community", "resources", "discussion", "networking"],
    "engagement_level": "High",
    "source_type": "Community"
  }}
]"""

    return prompt

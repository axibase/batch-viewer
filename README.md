<style>
    body {
        counter-reset: chapter;
    }

    h1 {
        counter-reset: paragraph;
    }

    h1::before {
        content: counter(chapter) ".";
        margin-right: 1em;
        counter-increment: chapter;
    }

    h1:hover::before {
        content: counter(chapter) ".";
        margin-right: 1em;
        counter-increment: chapter;
    }

    h2::before {
        content: counter(chapter) "." counter(paragraph) ".";
        margin-right: 1em;
        counter-increment: paragraph;
    }
</style>

[TOC]

# Chapter
## Paragraph

# Chapter
## Paragraph

# Chapter
## Paragraph

# Chapter
## Paragraph

# Chapter
## Paragraph

# Chapter
## Paragraph

```typescript
function foo(x: string): void {
    // Some code
}
```
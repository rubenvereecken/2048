TEXFILES=article.tex
PDF=article.pdf
PDFLATEXDRAFT=pdflatex -draftmode
PDFLATEX=pdflatex --file-line-error
PDFVIEW=open -a preview
BIBTEX=bibtex article

MAINTEX=$(PDF:%.pdf=%.tex)

all: $(TEXFILES)
	$(PDFLATEXDRAFT) $(MAINTEX)
	$(BIBTEX)
	$(PDFLATEXDRAFT) $(MAINTEX)
	$(PDFLATEX) $(MAINTEX)
	$(PDFVIEW) $(PDF)

min: $(TEXFILES)
	$(PDFLATEX) $(MAINTEX)
	$(PDFVIEW) $(PDF)

view: $(TEXFILES)
	$(PDFVIEW) $(PDF)

clean:
	@rm -rf $(TEXFILES:%.tex=%.aux) article.dvi article.log article.pdf article.lof article.toc article.lot article.out

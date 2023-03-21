$mm = {};

      const getJSON = async url => {
        const response = await fetch(url);
        return response.json(); // get JSON from the response 
      }

      function setLinkToFromRadio( nameRadio, nameNode = nameRadio) {
        let selector = 'input[name="' + nameRadio + '"]:checked',
            ele = document.querySelector(selector);
        
        if ( ele) {
          $mm.links.find( r => r.from == nameNode).to = ele.value; // set to to column
          $mm.links.find( r => r.from == nameNode).visible = true;

          $mm.links.find( r => r.to   == nameNode).visible = true;

        } else {
          // hide the related links (1 from, 1 to)
          $mm.links.find( r => r.from == nameNode).visible = false;
          $mm.links.find( r => r.to   == nameNode).visible = false;
        }
      }

      function sdMarkdown() {

        let mmMarkdown = '';
                
        mmMarkdown += 'flowchart LR \n ';

        let nodes = {};
        
        // add all links for the offering
        for ( let i = 0; i < $mm.links.length; i++) {
          let li = $mm.links[i];
          
          if (li.groups.indexOf( $mm.offering) >= 0 || $mm.showAll) {

            if ( li.extraCondition === undefined
              || li.extraCondition == ( $mm.protime ? 'protime' : 'no-protime')
              || li.extraCondition == ( $mm.enrich ? 'enrich' : 'no-enrich')
              || li.extraCondition == ( $mm.point2p ? 'p2p' : 'no-p2p')
              || $mm.showAll) {
              
              if ( !('visible' in li ) || li.visible) {

                mmMarkdown =  mmMarkdown + li.from + ' ' 
                          + li.link + (li.linkTxt ? '|' + li.linkTxt + '|' : '') + ' ' 
                          + li.to + ' \n ';

                // add to the nodes dictionary, and increment if key already exists.
                nodes[li.from] = (nodes[li.from] + 1) || 1;
                nodes[li.to] = (nodes[li.to] + 1) || 1;
              }

            }
          }
        }
        //console.log( nodes);

        // add fixed subgraph for payroll output
        mmMarkdown += 'subgraph out ["payroll output"]\n mysd \n mysp2 \n mft \n end \n';

        // add subgraph of hr input systems, with subgraph in subgraph (fixed) for myServicePoint
        mmMarkdown += 'subgraph hris ["  "]\n subgraph mysp ["my ServicePoint  "]\n cases \n unstruct \n end \n';
        if ( nodes['erp'] || $mm.showAll) {
          mmMarkdown += 'erp \n ';
        }
        
        if ( nodes['sdwp'] || $mm.showAll) {
          mmMarkdown += 'sdwp \n '
        }

        if ( nodes['protime'] || $mm.showAll) { 
          mmMarkdown += 'protime \n ';
        }

        if ( nodes['p2p'] || $mm.showAll) { 
          mmMarkdown += 'p2p \n ';
        }
        // to do: 4 times the same construct, functionize

        mmMarkdown += 'end \n ';

        // add node make up to the graph, when the node was part of a previous link
        for (const [key, value] of Object.entries(nodes)) {
          //console.log(key, value);
          if ($mm.nodes[key]) {
            mmMarkdown += key + $mm.nodes[key] + '\n';
          }
        }

        //mmMarkdown += 'click hr "https://www.sdworx.com" "svg title<br><i>italic html</i>" _blank\n';
        //mmMarkdown += 'click mft whateverFunction "svg title on callback"\n';

        console.log( '== start markdown mermaid ==');
        console.log( mmMarkdown);
        console.log( '== end markdown mermaid ==');

        return mmMarkdown;
      }

      let injectSvg = (mermaidSvg, idHtml) => {
        
        let diaParent = document.getElementById( idHtml);
        diaParent.innerHTML = '';

        // set title in h4, under idHtml
        // no title in Mermaid svg used, since then it becomes the hover text of each item.

        if ($mm.country) {
          let p = document.createElement("h4");
          p.innerHTML = [$mm.offering, 'flow', 'for', $mm.country].join( ' ');
          p.classList.add('mmTitle');
          diaParent.appendChild(p);
        }

        // inject the Mermaid svg in html element under idHtml.
        let dia = document.createElement("div");
        dia.innerHTML = mermaidSvg;
        diaParent.appendChild(dia);
      };
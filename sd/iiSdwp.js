iiSdwp = {
  "_get": ( pRoute) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', document.location.origin + pRoute, false);  // `false` makes the request synchronous
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('token'));
      
    xhr.send();
      
    if (xhr.status === 200) {
      let j = JSON.parse(xhr.responseText);
      
      return { 'status': 'ok', 'body': j};
    }
    else {
      let j = JSON.parse(xhr.responseText);
      console.log( 'oops', xhr.status, j.message);
           
      return { 'status': xhr.status, 'body': { 'error': j.message}};
    }
  },
      
  "_post": ( pRoute, pJson) => {
        const xhr = new XMLHttpRequest();
        xhr.open( 'POST', document.location.origin + pRoute, false);  // `false` makes the request synchronous
        xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('token'));
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      
        xhr.send(JSON.stringify(pJson));
      
        if (xhr.status === 200) {
          let j = {};
          if (xhr.responseText) {
            j = JSON.parse(xhr.responseText);
          } else {
            j = { 'status': 'ok', 'body': { 'msg': 'no response'}}
          }
      
          return { 'status': 'ok', 'body': j};
        }
        else {
          let j = JSON.parse(xhr.responseText);
          console.log( 'oops', xhr.status, j.message);
            
          return { 'status': xhr.status, 'body': { 'error': j.message}};
        }
      },
  
  "_delete": ( pRoute) => {
    const xhr = new XMLHttpRequest();
    xhr.open('DELETE', document.location.origin + pRoute, false);  // `false` makes the request synchronous
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('token'));
      
    xhr.send();
    
    if (xhr.status === 200) {
      let j = JSON.parse(xhr.responseText);
      
      return { 'status': 'ok', 'body': j};

    } else if (xhr.status === 204) {
      let j = {};
      if (xhr.responseText) {

        j = JSON.parse(xhr.responseText);
        
      } else {
        j = { 'status': 'ok', 'body': { 'msg': 'status 204: okay, no response'}}
      }
      
      return { 'status': 'ok', 'body': j};
    }
    else {
      let j = JSON.parse(xhr.responseText);
      console.log( 'oops', xhr.status, j.message);
            
      return { 'status': xhr.status, 'body': { 'error': j}};
    }
  },
  
  "get": {
    "client_regulations": () => {
      return iiSdwp._get( '/configtool-api/api/v1/regulation-tree');
    },
    "client_regulations_simple": () => {
      return iiSdwp._get( '/repository/api/v1/global/entityFormDescriptor/Jobs/Jobs');
    },
    "locations": () => {
      return iiSdwp._get( '/ga/api/v1/entity/getRepEntitiesShortViewByTree?tree=Locations');
    },
    "jobs": () => {
      return iiSdwp._get( '/ga/api/v1/entity/getRepEntitiesShortViewByTree?tree=Jobs');
    },
    "entities_by_tree": (tree) => {
      return iiSdwp._get( '/ga/api/v1/entity/getRepEntitiesShortViewByTree?tree=' + tree);
    },
    "trees": () => {
      return iiSdwp._get( '/repository/api/v1/global/entityTree?type=organization');
    },
    "entity": (id) => {
      return iiSdwp._get( '/ga/api/v1/entity/' + id);
    },
    "entityAttribute": (id, attribute) => {

      let entity = iiSdwp.get.entity(id),
          val = entity.body.data.attributes[attribute];
      
      return val;

    }
  },

  "delete": {
    "tree_entity": (id) => {
      // id must be a final leaf, if not an 400 will be thrown.
      console.log( 'try to delete entity', id);
      return iiSdwp._delete( '/ga/api/v1/entity/' + id);
    },
    "tree_from_top": ( tree_top_id) => {
      
      let treeName = iiSdwp.get.entityAttribute( tree_top_id, 'tree');
      
      let entities = iiSdwp.get.entities_by_tree( treeName).body;
      console.log( 'entities', entities);

      const fun = function (top_id) {

        let children = entities.filter( r => r.parentId == top_id);
        // console.log( 'ch', children);
          
        for (let i = 0; i < children.length; i++) {
          fun( children[i].id);
        }

        console.log( 'tree', top_id);

        if ( top_id != tree_top_id) {
          iiSdwp.delete.tree_entity(top_id);
        }
      }
      
      fun( tree_top_id);

    }
  },

  "id": {},

  "init": () => {
    console.log( 'init');

    let trees = iiSdwp.get.trees().body;
    console.log(trees);

    iiSdwp.id.tree1 = trees[0].id;
    iiSdwp.id.tree2 = trees[1].id;
    
    console.log( 'a tree', iiSdwp.id.tree1, trees[0].name);
    console.log( 'a tree', iiSdwp.id.tree2, trees[1].name);

    /* 
      also the company ids here? CliCoreId, via client regulations [0].cliCoreId
      maybe not, since this is only to re-token, and maybe we can get rid of it when better understanding the authentication reflow.
    */
    
    return 'ok';
  },

  "retoken": () => {
    window.location.href = '/ui/#/company/tree;treeId=' + iiSdwp.id.tree1;
    window.location.href = '/ui/#/company/tree;treeId=' + iiSdwp.id.tree2;
    
    return 'ok';
  },

  "createValue4Profile" : ( gloRegId, listName, value, profileName) => {
    /* 
      search for gloRegId in the array of regulations 
      and store the cliCoreId in the id record as optimization (calling the get only once).
    */
    if (!iiSdwp.id.cliCore) {
      let regulations = iiSdwp.get.client_regulations().body.nodes;
      
      let regulation = regulations.find( o => o.gloRegId == gloRegId);

      if (regulation) {
        iiSdwp.id.cliCore = regulation.cliCoreId;

      } else {
        return 'err: gloRegId not found in regulations : ' + gloRegId;

      }
    }
    //console.log(iiSdwp.id);
      
    let j = {
      "cliCoreId": iiSdwp.id.cliCore,
      "configEntitiesToCreate": [
          {
              "gloRegId": gloRegId,
              "name": listName + '/' + value,
              "profileName": profileName,
              "resource": "REP_LIST",
              "parentType": "REPLACE",
              "accessType": "ACCESS"
          }
      ],
      "configEntitiesToUpdate": [],
      "configEntitiesToDelete": []
    };
    console.log(j);

    return iiSdwp._post( '/configtool-api/api/v1/regulation/10001177/reg-profile-resource-access/bulk', j);
  },

  "createValues4Profile" : ( gloRegId, listName, values, profileName) => {
    values.forEach( 
      value => iiSdwp.createValue4Profile( gloRegId, listName, value, profileName)
    );
  },

  "copyValues2Profile" : ( gloRegId, listName, profileNameFrom, profileNameTo, maxItems = 99999) => {

    let route = "/configtool-api/api/v1/regulation/" + gloRegId 
              + "/rep-list?withParentRegulations=true&page=0&per-page=" + maxItems
              + "&order-by=gloReg.id&search=name=='" + listName + "'";
    
    let result = iiSdwp._get( route),
        body = result.body,
        valArray = [];

    for (let i=0; i< body.length; i++) {
      let rec = body[i];

      route = "/configtool-api/api/v1/regulation/global/reg-profile-resource-access?withParentRegulations=true&page=0&per-page=1000&search=name=='" 
            + listName + "/" + rec.value
            + "';resource=='REP_LIST'";
      let resultAccess = iiSdwp._get( route),
          bodyAccess = resultAccess.body,
          recAccessFrom = bodyAccess.find( o => o.profileName === profileNameFrom),
          recAccessTo   = bodyAccess.find( o => o.profileName === profileNameTo);
      
      if (!recAccessTo) {
        recAccessTo = { accessType: "none"};
      }
      console.log( rec.value, rec.transId, rec.id, recAccessFrom.accessType, recAccessTo.accessType);
      //console.log( recAccessFrom, recAccessTo);

      if ( recAccessFrom.accessType ==='ACCESS' && recAccessTo.accessType != 'ACCESS') {
        valArray.push( rec.value);
      }
    }

    console.log( 'values to be make accessible', valArray);
    
    iiSdwp.createValues4Profile( gloRegId, listName, valArray, profileNameTo);
  }

}

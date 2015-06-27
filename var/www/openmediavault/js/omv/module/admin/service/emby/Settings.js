/**
 * Copyright (C) 2014-2015 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")

Ext.define("OMV.module.admin.service.emby.Settings", {
    extend : "OMV.workspace.form.Panel",

    rpcService   : "Emby",
    rpcGetMethod : "getSettings",
    rpcSetMethod : "setSettings",

    plugins      : [{
        ptype        : "linkedfields",
        correlations : [{
            name        : [
              "enable"
            ],
            conditions  : [
                { name : "enable", value : true }
            ],
            properties : function(valid, field) {
                this.setButtonDisabled("restart", !valid);
                this.setButtonDisabled("webclient", !valid);
            }
        }]
    }],

    initComponent : function () {
        var me = this;

        me.on('load', function () {
            var checked = me.findField('enable').checked;
            var showtab = me.findField('showtab').checked;
            var parent = me.up('tabpanel');

            if (!parent)
                return;

            var webClientPanel = parent.down('panel[title=' + _("Web Client") + ']');

            if (webClientPanel) {
                checked ? webClientPanel.enable() : webClientPanel.disable();
                showtab ? webClientPanel.tab.show() : webClientPanel.tab.hide();
            }
        });
        me.callParent(arguments);
    },

    getButtonItems : function() {
        var me = this;
        var items = me.callParent(arguments);
        items.push({
            id       : me.getId() + "-restart",
            xtype    : "button",
            text     : _("Restart"),
            icon     : "images/reboot.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled : true,
            scope    : me,
            handler  : function() {
                // Execute RPC.
                OMV.Rpc.request({
                    scope       : this,
                    callback    : function(id, success, response) {
                        this.doRestart();
                    },
                    relayErrors : false,
                    rpcData     : {
                        service  : "Emby",
                        method   : "doRestart"
                    }
                });
            }
        },{
            id       : me.getId() + "-webclient",
            xtype    : "button",
			text    : _("Emby Web Client"),
            icon     : "images/emby.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled : true,
            scope    : me,
            handler  : function() {
				var link = 'http://' + location.hostname + ':8096/mediabrowser';
				window.open(link, '_blank');
            }
        });
        return items;
    },

    getFormItems : function() {
        return [{
            xtype    : "fieldset",
            title    : _("General settings"),
            defaults : {
                labelSeparator : ""
            },
            items    : [{
                xtype      : "checkbox",
                name       : "enable",
                fieldLabel : _("Enable"),
                checked    : false
            },{
                xtype         : "combo",
                name          : "mntentref",
                fieldLabel    : _("Database Volume"),
                emptyText     : _("Select a volume ..."),
                allowBlank    : true,
                allowNone     : false,
                editable      : false,
                triggerAction : "all",
                displayField  : "description",
                valueField    : "uuid",
                store         : Ext.create("OMV.data.Store", {
                    autoLoad : true,
                    model    : OMV.data.Model.createImplicit({
                        idProperty : "uuid",
                        fields     : [
                            { name  : "uuid", type : "string" },
                            { name  : "devicefile", type : "string" },
                            { name  : "description", type : "string" }
                        ]
                    }),
                    proxy    : {
                        type    : "rpc",
                        rpcData : {
                            service : "ShareMgmt",
                            method  : "getCandidates"
                        },
                        appendSortParams : false
                    },
                    sorters  : [{
                        direction: "ASC",
                        property: "devicefile"
                    }]
                }),
                plugins : [{
                    ptype : "fieldinfo",
                    text  : _("Database files will move to new location if database volume is changed.")
                }]
            },{
                xtype      : "textfield",
                name       : "db-folder",
                fieldLabel : _("Database Folder"),
                allowNone  : true,
                readOnly   : true
            },{
                xtype      : "checkbox",
                name       : "showtab",
                fieldLabel : _("Show Client"),
                boxLabel   : _("Show tab containing Web Client frame."),
                checked    : false
            },{
                xtype      : "button",
                name       : "update",
                id         : this.getId() + "-update",
                text       : _("Force update"),
                scope      : this,
                margin     : "0 0 5 0",
                handler    : Ext.Function.bind(this.onUpdate, this, [ this ])
            }]
        }];
    },

    onUpdate : function() {
        Ext.create("OMV.window.Execute", {
            title          : _("Click start to force update..."),
            rpcService     : "Emby",
            rpcMethod      : "doUpdate",
            hideStopButton : true,
            listeners      : {
                exception  : function(wnd, error) { OMV.MessageBox.error(null, error);}
            }
        }).show();
    }
});

OMV.WorkspaceManager.registerPanel({
    id        : "settings",
    path      : "/service/emby",
    text      : _("Settings"),
    position  : 10,
    className : "OMV.module.admin.service.emby.Settings"
});
